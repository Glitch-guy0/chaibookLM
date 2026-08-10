import { Pool } from '@neondatabase/serverless';
import type { QueryResultRow } from '@neondatabase/serverless';
import type {
  User,
  Notebook,
  Source,
  ChatMessage,
  LimitCounter,
  LimitsConfig,
} from '../../shared-kernel/types';

// ---------------------------------------------------------------------------
// Schema migration
// ---------------------------------------------------------------------------

export const SCHEMA_MIGRATION = `
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notebooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled',
  source_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_expires_at ON notebooks(expires_at);

CREATE TABLE IF NOT EXISTS sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('text', 'web')),
  title       TEXT NOT NULL DEFAULT 'Untitled',
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  size        INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sources ADD COLUMN IF NOT EXISTS fail_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_sources_notebook_id ON sources(notebook_id);
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  citations   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_notebook_id ON chat_messages(notebook_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

CREATE TABLE IF NOT EXISTS limit_counters (
  user_id       TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('notebooks', 'sources_per_user', 'sources_per_notebook', 'source_size')),
  count         INTEGER NOT NULL DEFAULT 0,
  cap           INTEGER NOT NULL,
  PRIMARY KEY (user_id, resource_type)
);
`;

// ---------------------------------------------------------------------------
// Row helpers
// ---------------------------------------------------------------------------

function rowToUser(row: QueryResultRow): User {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
  };
}

function rowToNotebook(row: QueryResultRow): Notebook {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    sourceCount: row.source_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function rowToSource(row: QueryResultRow): Source {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    status: row.status,
    size: row.size,
    failReason: row.fail_reason ?? undefined,
    createdAt: row.created_at,
  };
}

function rowToChatMessage(row: QueryResultRow): ChatMessage {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    citations: row.citations ?? undefined,
    createdAt: row.created_at,
  };
}

function rowToLimitCounter(row: QueryResultRow): LimitCounter {
  return {
    userId: row.user_id,
    resourceType: row.resource_type,
    count: row.count,
    cap: row.cap,
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class NeonRepository {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async runMigrations(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(SCHEMA_MIGRATION);
    } finally {
      client.release();
    }
  }

  // ── Users ──────────────────────────────────────────────────────────────

  async createUser(id: string, email: string): Promise<User> {
    const { rows } = await this.pool.query(
      `INSERT INTO users (id, email) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
      [id, email],
    );
    return rowToUser(rows[0]);
  }

  async findByClerkId(id: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  }

  // ── Notebooks ──────────────────────────────────────────────────────────

  async createNotebook(
    userId: string,
    title: string,
    ttlDays: number,
  ): Promise<Notebook> {
    const { rows } = await this.pool.query(
      `INSERT INTO notebooks (user_id, title, expires_at)
       VALUES ($1, $2, now() + make_interval(days => $3))
       RETURNING *`,
      [userId, title, ttlDays],
    );
    return rowToNotebook(rows[0]);
  }

  async findNotebooksByUserId(userId: string): Promise<Notebook[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM notebooks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return rows.map(rowToNotebook);
  }

  async findNotebookById(id: string): Promise<Notebook | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM notebooks WHERE id = $1',
      [id],
    );
    return rows.length > 0 ? rowToNotebook(rows[0]) : null;
  }

  async renameNotebook(id: string, title: string): Promise<Notebook | null> {
    const { rows } = await this.pool.query(
      'UPDATE notebooks SET title = $2 WHERE id = $1 RETURNING *',
      [id, title],
    );
    return rows.length > 0 ? rowToNotebook(rows[0]) : null;
  }

  async deleteNotebook(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM notebooks WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  async findExpiredNotebooks(): Promise<Notebook[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM notebooks WHERE expires_at <= now()',
    );
    return rows.map(rowToNotebook);
  }

  // ── Sources ────────────────────────────────────────────────────────────

  async createSource(
    notebookId: string,
    userId: string,
    type: 'text' | 'web',
    title: string,
  ): Promise<Source> {
    const { rows } = await this.pool.query(
      `INSERT INTO sources (notebook_id, user_id, type, title)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [notebookId, userId, type, title],
    );
    return rowToSource(rows[0]);
  }

  async findSourcesByNotebookId(notebookId: string): Promise<Source[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM sources WHERE notebook_id = $1 ORDER BY created_at DESC',
      [notebookId],
    );
    return rows.map(rowToSource);
  }

  async findSourceById(id: string): Promise<Source | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM sources WHERE id = $1',
      [id],
    );
    return rows.length > 0 ? rowToSource(rows[0]) : null;
  }

  async deleteSourcesByNotebookId(notebookId: string): Promise<number> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM sources WHERE notebook_id = $1',
      [notebookId],
    );
    return rowCount ?? 0;
  }

  async countSourcesByUser(userId: string): Promise<number> {
    const { rows } = await this.pool.query(
      'SELECT COUNT(*)::int AS cnt FROM sources WHERE user_id = $1',
      [userId],
    );
    return rows[0].cnt;
  }

  async countSourcesByNotebook(notebookId: string): Promise<number> {
    const { rows } = await this.pool.query(
      'SELECT COUNT(*)::int AS cnt FROM sources WHERE notebook_id = $1',
      [notebookId],
    );
    return rows[0].cnt;
  }

  /**
   * Update a source's ingestion status. A `failReason` is persisted when the
   * status is `failed` and cleared otherwise. Returns null when the source does
   * not exist.
   */
  async setSourceStatus(
    id: string,
    status: 'queued' | 'processing' | 'ready' | 'failed',
    reason?: string,
  ): Promise<Source | null> {
    const { rows } = await this.pool.query(
      `UPDATE sources
       SET status = $2,
           fail_reason = CASE WHEN $2 = 'failed' THEN $3 ELSE NULL END
       WHERE id = $1
       RETURNING *`,
      [id, status, reason ?? null],
    );
    return rows.length > 0 ? rowToSource(rows[0]) : null;
  }

  async deleteSource(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM sources WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  // ── Chat Messages ──────────────────────────────────────────────────────

  async createChatMessage(
    notebookId: string,
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    citations?: unknown,
  ): Promise<ChatMessage> {
    const { rows } = await this.pool.query(
      `INSERT INTO chat_messages (notebook_id, user_id, role, content, citations)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [notebookId, userId, role, content, citations ? JSON.stringify(citations) : null],
    );
    return rowToChatMessage(rows[0]);
  }

  async findChatMessagesByNotebookId(
    notebookId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM chat_messages WHERE notebook_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
      [notebookId, limit, offset],
    );
    return rows.map(rowToChatMessage);
  }

  // ── Limit Counters ─────────────────────────────────────────────────────

  async getOrCreateCounter(
    userId: string,
    resourceType: LimitCounter['resourceType'],
    cap: number,
  ): Promise<LimitCounter> {
    const { rows } = await this.pool.query(
      `INSERT INTO limit_counters (user_id, resource_type, count, cap)
       VALUES ($1, $2, 0, $3)
       ON CONFLICT (user_id, resource_type)
       DO UPDATE SET cap = EXCLUDED.cap
       RETURNING *`,
      [userId, resourceType, cap],
    );
    return rowToLimitCounter(rows[0]);
  }

  /**
   * Atomically check the cap and increment the counter inside a transaction.
   * Returns the updated counter if the increment succeeded, or null if the cap
   * would be exceeded.
   */
  async incrementIfUnderCap(
    userId: string,
    resourceType: LimitCounter['resourceType'],
  ): Promise<LimitCounter | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: lockRows } = await client.query(
        `SELECT count, cap FROM limit_counters
         WHERE user_id = $1 AND resource_type = $2
         FOR UPDATE`,
        [userId, resourceType],
      );

      if (lockRows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const { count, cap } = lockRows[0];

      if (count >= cap) {
        await client.query('ROLLBACK');
        return null;
      }

      const { rows: updatedRows } = await client.query(
        `UPDATE limit_counters
         SET count = count + 1
         WHERE user_id = $1 AND resource_type = $2
         RETURNING *`,
        [userId, resourceType],
      );

      await client.query('COMMIT');
      return rowToLimitCounter(updatedRows[0]);
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Already disconnected; original error is the root cause
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Reconcile a counter down by one. The WHERE count > 0 clause acts as a
   * double-bump guard — deleting something that was never counted cannot
   * drive the counter negative.
   */
  async decrementCounter(
    userId: string,
    resourceType: LimitCounter['resourceType'],
  ): Promise<LimitCounter | null> {
    const { rows } = await this.pool.query(
      `UPDATE limit_counters
       SET count = GREATEST(count - 1, 0)
       WHERE user_id = $1 AND resource_type = $2
       RETURNING *`,
      [userId, resourceType],
    );
    return rows.length > 0 ? rowToLimitCounter(rows[0]) : null;
  }

  /**
   * Reconcile a counter to reflect the actual persisted count of a resource.
   * Used after bulk deletes or TTL sweeps.
   */
  async reconcileCounter(
    userId: string,
    resourceType: LimitCounter['resourceType'],
    actualCount: number,
  ): Promise<LimitCounter | null> {
    const { rows } = await this.pool.query(
      `UPDATE limit_counters
       SET count = $3
       WHERE user_id = $1 AND resource_type = $2
       RETURNING *`,
      [userId, resourceType, actualCount],
    );
    return rows.length > 0 ? rowToLimitCounter(rows[0]) : null;
  }

  async dispose(): Promise<void> {
    await this.pool.end();
  }
}