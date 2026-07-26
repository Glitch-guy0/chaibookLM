import fs from "fs";
import path from "path";
import os from "os";
import { createClient } from "@supabase/supabase-js";

export interface SourceRecord {
  id: string;
  notebookId: string;
  userId: string;
  title: string;
  type: "pdf" | "text" | "vtt" | "youtube" | "web";
  urlOrPath: string;
  sizeBytes: number;
  status: "uploading" | "indexing" | "ready" | "failed";
  createdAt: string;
  contentSnippet?: string;
}

export interface NotebookRecord {
  id: string;
  userId: string;
  title: string;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
}

// Initialize Supabase Client for DB operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Fallback directory in writable /tmp (for Vercel serverless environment)
const TMP_DB_DIR = path.join(os.tmpdir(), "chaibooklm_db");
const TMP_NOTEBOOKS_FILE = path.join(TMP_DB_DIR, "notebooks.json");
const TMP_SOURCES_FILE = path.join(TMP_DB_DIR, "sources.json");

// In-memory cache for seamless response fallback
let memoryNotebooks: NotebookRecord[] = [];
let memorySources: SourceRecord[] = [];

function ensureTmpDb() {
  try {
    if (!fs.existsSync(TMP_DB_DIR)) {
      fs.mkdirSync(TMP_DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(TMP_NOTEBOOKS_FILE)) {
      fs.writeFileSync(TMP_NOTEBOOKS_FILE, JSON.stringify(memoryNotebooks));
    }
    if (!fs.existsSync(TMP_SOURCES_FILE)) {
      fs.writeFileSync(TMP_SOURCES_FILE, JSON.stringify(memorySources));
    }
  } catch (err) {
    console.warn("[DB Fallback] Failed to write to /tmp file:", err);
  }
}

function readTmpNotebooks(): NotebookRecord[] {
  ensureTmpDb();
  try {
    const raw = fs.readFileSync(TMP_NOTEBOOKS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return memoryNotebooks;
  }
}

function writeTmpNotebooks(list: NotebookRecord[]) {
  memoryNotebooks = list;
  ensureTmpDb();
  try {
    fs.writeFileSync(TMP_NOTEBOOKS_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.warn("[DB Fallback] Could not save notebooks to /tmp:", err);
  }
}

function readTmpSources(): SourceRecord[] {
  ensureTmpDb();
  try {
    const raw = fs.readFileSync(TMP_SOURCES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return memorySources;
  }
}

function writeTmpSources(list: SourceRecord[]) {
  memorySources = list;
  ensureTmpDb();
  try {
    fs.writeFileSync(TMP_SOURCES_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.warn("[DB Fallback] Could not save sources to /tmp:", err);
  }
}

function mapNotebook(data: any): NotebookRecord {
  return {
    id: data.id,
    userId: data.user_id || data.userId || "",
    title: data.title || "Untitled Notebook",
    collectionName:
      data.collection_name || data.collectionName || `coll_${data.id}`,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  };
}

function mapSource(data: any): SourceRecord {
  return {
    id: data.id,
    notebookId: data.notebook_id || data.notebookId || "",
    userId: data.user_id || data.userId || "",
    title: data.title || "Uploaded Source",
    type: data.type || "text",
    urlOrPath: data.url_or_path || data.urlOrPath || "",
    sizeBytes: Number(data.size_bytes || data.sizeBytes || 0),
    status: data.status || "ready",
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    contentSnippet: data.content_snippet || data.contentSnippet || "",
  };
}

/* ─────────────────────────────────────────────────────────────
 * NOTEBOOKS DB OPERATIONS (SUPABASE + TMP FALLBACK)
 * ───────────────────────────────────────────────────────────── */

export async function getNotebooks(userId: string): Promise<NotebookRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("notebooks")
        .select("*")
        .or(`user_id.eq.${userId},userId.eq.${userId}`);

      if (!error && data) {
        return data.map(mapNotebook);
      }
    } catch (err) {
      console.warn("[DB] Supabase getNotebooks failed, using /tmp fallback:", err);
    }
  }

  return readTmpNotebooks().filter((nb) => nb.userId === userId);
}

export async function getNotebookById(
  id: string,
  userId: string
): Promise<NotebookRecord | null> {
  const notebooks = await getNotebooks(userId);
  return notebooks.find((nb) => nb.id === id) || null;
}

export async function createNotebook(
  userId: string,
  title: string
): Promise<NotebookRecord> {
  const id = `nb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: NotebookRecord = {
    id,
    userId,
    title: title.trim() || "Untitled Notebook",
    collectionName: `coll_${id}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { error } = await supabase.from("notebooks").insert([
        {
          id: record.id,
          user_id: record.userId,
          userId: record.userId,
          title: record.title,
          collection_name: record.collectionName,
          collectionName: record.collectionName,
          created_at: record.createdAt,
          createdAt: record.createdAt,
          updated_at: record.updatedAt,
          updatedAt: record.updatedAt,
        },
      ]);

      if (!error) {
        // Also update local cache for immediate read consistency
        const list = readTmpNotebooks();
        list.push(record);
        writeTmpNotebooks(list);
        return record;
      }
      console.warn("[DB] Supabase createNotebook insert error, using /tmp fallback:", error.message);
    } catch (err) {
      console.warn("[DB] Supabase createNotebook error, using /tmp fallback:", err);
    }
  }

  const list = readTmpNotebooks();
  list.push(record);
  writeTmpNotebooks(list);
  return record;
}

export async function deleteNotebook(
  id: string,
  userId: string
): Promise<boolean> {
  let deleted = false;

  if (supabase) {
    try {
      const { error } = await supabase
        .from("notebooks")
        .delete()
        .eq("id", id);

      if (!error) {
        await supabase.from("sources").delete().eq("notebook_id", id);
        await supabase.from("sources").delete().eq("notebookId", id);
        deleted = true;
      }
    } catch (err) {
      console.warn("[DB] Supabase deleteNotebook failed:", err);
    }
  }

  const list = readTmpNotebooks();
  const filtered = list.filter((nb) => !(nb.id === id && nb.userId === userId));
  if (filtered.length !== list.length) {
    writeTmpNotebooks(filtered);

    const sources = readTmpSources();
    writeTmpSources(sources.filter((s) => s.notebookId !== id));
    deleted = true;
  }

  return deleted;
}

/* ─────────────────────────────────────────────────────────────
 * SOURCES DB OPERATIONS (SUPABASE + TMP FALLBACK)
 * ───────────────────────────────────────────────────────────── */

export async function getSources(
  notebookId: string,
  userId: string
): Promise<SourceRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .or(`notebook_id.eq.${notebookId},notebookId.eq.${notebookId}`);

      if (!error && data) {
        return data.map(mapSource).filter((s) => s.userId === userId || !s.userId);
      }
    } catch (err) {
      console.warn("[DB] Supabase getSources failed, using /tmp fallback:", err);
    }
  }

  return readTmpSources().filter(
    (s) => s.notebookId === notebookId && s.userId === userId
  );
}

export async function addSource(
  record: Omit<SourceRecord, "id" | "createdAt">
): Promise<SourceRecord> {
  const newRecord: SourceRecord = {
    ...record,
    id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { error } = await supabase.from("sources").insert([
        {
          id: newRecord.id,
          notebook_id: newRecord.notebookId,
          notebookId: newRecord.notebookId,
          user_id: newRecord.userId,
          userId: newRecord.userId,
          title: newRecord.title,
          type: newRecord.type,
          url_or_path: newRecord.urlOrPath,
          urlOrPath: newRecord.urlOrPath,
          size_bytes: newRecord.sizeBytes,
          sizeBytes: newRecord.sizeBytes,
          status: newRecord.status,
          created_at: newRecord.createdAt,
          createdAt: newRecord.createdAt,
          content_snippet: newRecord.contentSnippet || "",
          contentSnippet: newRecord.contentSnippet || "",
        },
      ]);

      if (!error) {
        const list = readTmpSources();
        list.push(newRecord);
        writeTmpSources(list);
        return newRecord;
      }
      console.warn("[DB] Supabase addSource insert error, using /tmp fallback:", error.message);
    } catch (err) {
      console.warn("[DB] Supabase addSource error, using /tmp fallback:", err);
    }
  }

  const list = readTmpSources();
  list.push(newRecord);
  writeTmpSources(list);
  return newRecord;
}

export async function updateSourceStatus(
  id: string,
  status: SourceRecord["status"]
): Promise<void> {
  if (supabase) {
    try {
      await supabase
        .from("sources")
        .update({ status })
        .eq("id", id);
    } catch (err) {
      console.warn("[DB] Supabase updateSourceStatus failed:", err);
    }
  }

  const list = readTmpSources();
  const src = list.find((s) => s.id === id);
  if (src) {
    src.status = status;
    writeTmpSources(list);
  }
}

export async function deleteSource(
  id: string,
  userId: string
): Promise<boolean> {
  let deleted = false;

  if (supabase) {
    try {
      const { error } = await supabase
        .from("sources")
        .delete()
        .eq("id", id);

      if (!error) {
        deleted = true;
      }
    } catch (err) {
      console.warn("[DB] Supabase deleteSource error:", err);
    }
  }

  const list = readTmpSources();
  const filtered = list.filter((s) => !(s.id === id && s.userId === userId));
  if (filtered.length !== list.length) {
    writeTmpSources(filtered);
    deleted = true;
  }

  return deleted;
}
