import { Pool } from '@neondatabase/serverless';
import type { QueryResultRow } from '@neondatabase/serverless';
import type {
  User,
  Notebook,
  Source,
  ChatMessage,
  CitationSnapshot,
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
  type        TEXT NOT NULL CHECK (type IN ('text', 'web', 'pdf', 'transcript', 'youtube')),
  title       TEXT NOT NULL DEFAULT 'Untitled',
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  size        INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sources ADD COLUMN IF NOT EXISTS fail_reason TEXT;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;

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

CREATE TABLE IF NOT EXISTS telemetry_file_uploads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID,
  user_id        TEXT,
  byte_size      INTEGER NOT NULL DEFAULT 0,
  mime_type      TEXT NOT NULL DEFAULT 'text/plain',
  duration_ms    INTEGER NOT NULL DEFAULT 0,
  error_category TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_uploads_created_at ON telemetry_file_uploads(created_at);

CREATE TABLE IF NOT EXISTS telemetry_chat_prompts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT,
  notebook_id       UUID,
  prompt_length     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms        INTEGER NOT NULL DEFAULT 0,
  credit_cost       INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_prompts_created_at ON telemetry_chat_prompts(created_at);

CREATE TABLE IF NOT EXISTS telemetry_daily_aggregates (
  date_ist                DATE PRIMARY KEY,
  total_uploads           INTEGER NOT NULL DEFAULT 0,
  total_bytes             BIGINT NOT NULL DEFAULT 0,
  avg_duration_ms         INTEGER NOT NULL DEFAULT 0,
  failed_uploads          INTEGER NOT NULL DEFAULT 0,
  total_queries           INTEGER NOT NULL DEFAULT 0,
  total_prompt_chars      BIGINT NOT NULL DEFAULT 0,
  total_completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_credits_spent     INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE telemetry_daily_aggregates ADD COLUMN IF NOT EXISTS total_queries INTEGER DEFAULT 0;
ALTER TABLE telemetry_daily_aggregates ADD COLUMN IF NOT EXISTS total_prompt_chars BIGINT DEFAULT 0;
ALTER TABLE telemetry_daily_aggregates ADD COLUMN IF NOT EXISTS total_completion_tokens BIGINT DEFAULT 0;
ALTER TABLE telemetry_daily_aggregates ADD COLUMN IF NOT EXISTS total_credits_spent INTEGER DEFAULT 0;
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
    chunkCount: typeof row.chunk_count === 'number' ? row.chunk_count : undefined,
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

  constructor(connectionString: string = process.env.DATABASE_URL || '') {
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
    type: Source['type'],
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
    chunkCount?: number,
  ): Promise<Source | null> {
    const { rows } = await this.pool.query(
      `UPDATE sources
       SET status = $2,
           fail_reason = CASE WHEN $2 = 'failed' THEN $3 ELSE NULL END,
           chunk_count = COALESCE($4, chunk_count)
       WHERE id = $1
       RETURNING *`,
      [id, status, reason ?? null, chunkCount ?? null],
    );
    return rows.length > 0 ? rowToSource(rows[0]) : null;
  }

  /**
   * Atomically claim a queued source for ingestion by transitioning it to
   * `processing` only if it is still `queued`. Returns null if another writer
   * already claimed it (or it no longer exists), preventing duplicate
   * ingestion of the same source.
   */
  async claimSourceForIngestion(id: string): Promise<Source | null> {
    const { rows } = await this.pool.query(
      `UPDATE sources
       SET status = 'processing'
       WHERE id = $1 AND status = 'queued'
       RETURNING *`,
      [id],
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
    citations?: CitationSnapshot[],
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

  /**
   * Returns the most recent `limit` messages for a notebook, in chronological
   * (oldest-first) order. Fetches DESC LIMIT then reverses in application
   * code -- unlike `findChatMessagesByNotebookId` (ascending order, capped at
   * a caller-supplied page size starting from `offset`), this always gets
   * the *newest* window regardless of how much history exists, which is what
   * the last-7-turns chat context window needs (AD-9).
   */
  async findRecentChatMessages(
    notebookId: string,
    limit: number,
  ): Promise<ChatMessage[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM chat_messages WHERE notebook_id = $1 ORDER BY created_at DESC LIMIT $2',
      [notebookId, limit],
    );
    return rows.map(rowToChatMessage).reverse();
  }

  /**
   * Cursor-paginated chat history for `ChatPanel`'s scroll-to-load-older
   * flow (Story 4.5) -- distinct from `findRecentChatMessages` (which always
   * gets the newest window for the AD-9 model-context path and is never
   * touched by this method). With no `beforeMessageId`, returns the most
   * recent `limit` rows (same DESC-then-reverse shape as
   * `findRecentChatMessages`). With `beforeMessageId`, first resolves that
   * row's `(created_at, id)` cursor, then returns the next `limit` rows
   * strictly older than it, so a message inserted concurrently can never
   * shift page boundaries the way plain OFFSET pagination would. `hasMore`
   * is true only when exactly `limit` rows came back, letting the caller
   * stop paginating once fewer than a full page remains.
   */
  async findChatMessagesBefore(
    notebookId: string,
    limit: number,
    beforeMessageId?: string,
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    let rows: QueryResultRow[];
    if (beforeMessageId) {
      const result = await this.pool.query(
        `SELECT cm.* FROM chat_messages cm
         WHERE cm.notebook_id = $1
           AND (cm.created_at, cm.id) < (
             SELECT created_at, id FROM chat_messages WHERE id = $2 AND notebook_id = $1
           )
         ORDER BY cm.created_at DESC, cm.id DESC
         LIMIT $3`,
        [notebookId, beforeMessageId, limit],
      );
      rows = result.rows;
    } else {
      const result = await this.pool.query(
        'SELECT * FROM chat_messages WHERE notebook_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2',
        [notebookId, limit],
      );
      rows = result.rows;
    }
    const messages = rows.map(rowToChatMessage).reverse();
    return { messages, hasMore: rows.length === limit };
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

  /**
   * Non-blocking operational telemetry for source ingestion (AC-2.6.1).
   * Appends a log record to telemetry_file_uploads. Adds < 15ms overhead.
   */
  async recordUploadTelemetry(params: {
    sourceId?: string;
    userId?: string;
    byteSize: number;
    mimeType: string;
    durationMs: number;
    errorCategory?: string | null;
  }): Promise<void> {
    await this.pool
      .query(
        `INSERT INTO telemetry_file_uploads (source_id, user_id, byte_size, mime_type, duration_ms, error_category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          params.sourceId ?? null,
          params.userId ?? null,
          params.byteSize,
          params.mimeType,
          params.durationMs,
          params.errorCategory ?? null,
        ],
      )
      .catch(() => {});
  }

  /**
   * Non-blocking operational telemetry for chat prompt usage (AC-3.5.1).
   * Appends a log record to telemetry_chat_prompts. Adds < 15ms overhead.
   * Strictly records operational metrics (no raw prompt or response text).
   */
  async recordChatTelemetry(params: {
    userId?: string;
    notebookId?: string;
    promptLength: number;
    completionTokens: number;
    latencyMs: number;
    creditCost?: number;
  }): Promise<void> {
    await this.pool
      .query(
        `INSERT INTO telemetry_chat_prompts (user_id, notebook_id, prompt_length, completion_tokens, latency_ms, credit_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          params.userId ?? null,
          params.notebookId ?? null,
          params.promptLength,
          params.completionTokens,
          params.latencyMs,
          params.creditCost ?? 1,
        ],
      )
      .catch(() => {});
  }

  /**
   * Daily rollup aggregation for operational telemetry (AC-2.6.3 & AC-3.5.3).
   * Aggregates records for dateIst into telemetry_daily_aggregates.
   */
  async aggregateDailyTelemetry(dateIst: string): Promise<{
    dateIst: string;
    totalUploads: number;
    totalBytes: number;
    avgDurationMs: number;
    failedUploads: number;
    totalQueries?: number;
    totalPromptChars?: number;
    totalCompletionTokens?: number;
    totalCreditsSpent?: number;
  }> {
    const { rows: uploadRows } = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total_uploads,
         COALESCE(SUM(byte_size), 0)::bigint AS total_bytes,
         COALESCE(AVG(duration_ms), 0)::int AS avg_duration_ms,
         COUNT(CASE WHEN error_category IS NOT NULL THEN 1 END)::int AS failed_uploads
       FROM telemetry_file_uploads
       WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = $1::date`,
      [dateIst],
    );

    const { rows: promptRows } = await this.pool.query(
      `SELECT
         COUNT(*)::int AS total_queries,
         COALESCE(SUM(prompt_length), 0)::bigint AS total_prompt_chars,
         COALESCE(SUM(completion_tokens), 0)::bigint AS total_completion_tokens,
         COALESCE(SUM(credit_cost), 0)::int AS total_credits_spent
       FROM telemetry_chat_prompts
       WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = $1::date`,
      [dateIst],
    );

    const agg = uploadRows[0] || {
      total_uploads: 0,
      total_bytes: 0,
      avg_duration_ms: 0,
      failed_uploads: 0,
    };

    const promptAgg = promptRows[0] || {
      total_queries: 0,
      total_prompt_chars: 0,
      total_completion_tokens: 0,
      total_credits_spent: 0,
    };

    await this.pool
      .query(
        `INSERT INTO telemetry_daily_aggregates (date_ist, total_uploads, total_bytes, avg_duration_ms, failed_uploads)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (date_ist) DO UPDATE
         SET total_uploads = EXCLUDED.total_uploads,
             total_bytes = EXCLUDED.total_bytes,
             avg_duration_ms = EXCLUDED.avg_duration_ms,
             failed_uploads = EXCLUDED.failed_uploads`,
        [
          dateIst,
          agg.total_uploads,
          agg.total_bytes,
          agg.avg_duration_ms,
          agg.failed_uploads,
        ],
      )
      .catch(() => {});

    await this.pool
      .query(
        `UPDATE telemetry_daily_aggregates
         SET total_queries = $2,
             total_prompt_chars = $3,
             total_completion_tokens = $4,
             total_credits_spent = $5
         WHERE date_ist = $1`,
        [
          dateIst,
          promptAgg.total_queries,
          promptAgg.total_prompt_chars,
          promptAgg.total_completion_tokens,
          promptAgg.total_credits_spent,
        ],
      )
      .catch(() => {});

    return {
      dateIst,
      totalUploads: agg.total_uploads,
      totalBytes: Number(agg.total_bytes),
      avgDurationMs: agg.avg_duration_ms,
      failedUploads: agg.failed_uploads,
      totalQueries: promptAgg.total_queries,
      totalPromptChars: Number(promptAgg.total_prompt_chars),
      totalCompletionTokens: Number(promptAgg.total_completion_tokens),
      totalCreditsSpent: promptAgg.total_credits_spent,
    };
  }

  async dispose(): Promise<void> {
    await this.pool.end();
  }
}