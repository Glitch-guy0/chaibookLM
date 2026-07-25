import fs from "fs";
import path from "path";

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

const DB_DIR = path.join(process.cwd(), "docs", "db_store");
const NOTEBOOKS_FILE = path.join(DB_DIR, "notebooks.json");
const SOURCES_FILE = path.join(DB_DIR, "sources.json");

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(NOTEBOOKS_FILE)) {
    fs.writeFileSync(NOTEBOOKS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(SOURCES_FILE)) {
    fs.writeFileSync(SOURCES_FILE, JSON.stringify([]));
  }
}

export function getNotebooks(userId: string): NotebookRecord[] {
  ensureDb();
  try {
    const raw = fs.readFileSync(NOTEBOOKS_FILE, "utf-8");
    const list: NotebookRecord[] = JSON.parse(raw);
    return list.filter((nb) => nb.userId === userId);
  } catch {
    return [];
  }
}

export function getNotebookById(id: string, userId: string): NotebookRecord | null {
  const notebooks = getNotebooks(userId);
  return notebooks.find((nb) => nb.id === id) || null;
}

export function createNotebook(userId: string, title: string): NotebookRecord {
  ensureDb();
  const notebooksRaw = fs.readFileSync(NOTEBOOKS_FILE, "utf-8");
  const list: NotebookRecord[] = JSON.parse(notebooksRaw);

  const id = `nb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: NotebookRecord = {
    id,
    userId,
    title: title.trim() || "Untitled Notebook",
    collectionName: `coll_${id}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.push(record);
  fs.writeFileSync(NOTEBOOKS_FILE, JSON.stringify(list, null, 2));
  return record;
}

export function deleteNotebook(id: string, userId: string): boolean {
  ensureDb();
  const notebooksRaw = fs.readFileSync(NOTEBOOKS_FILE, "utf-8");
  let list: NotebookRecord[] = JSON.parse(notebooksRaw);
  const initialLength = list.length;
  list = list.filter((nb) => !(nb.id === id && nb.userId === userId));

  if (list.length !== initialLength) {
    fs.writeFileSync(NOTEBOOKS_FILE, JSON.stringify(list, null, 2));
    // Also cleanup sources
    const sourcesRaw = fs.readFileSync(SOURCES_FILE, "utf-8");
    let sources: SourceRecord[] = JSON.parse(sourcesRaw);
    sources = sources.filter((s) => s.notebookId !== id);
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2));
    return true;
  }
  return false;
}

export function getSources(notebookId: string, userId: string): SourceRecord[] {
  ensureDb();
  try {
    const raw = fs.readFileSync(SOURCES_FILE, "utf-8");
    const list: SourceRecord[] = JSON.parse(raw);
    return list.filter((s) => s.notebookId === notebookId && s.userId === userId);
  } catch {
    return [];
  }
}

export function addSource(record: Omit<SourceRecord, "id" | "createdAt">): SourceRecord {
  ensureDb();
  const raw = fs.readFileSync(SOURCES_FILE, "utf-8");
  const list: SourceRecord[] = JSON.parse(raw);

  const newRecord: SourceRecord = {
    ...record,
    id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  list.push(newRecord);
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(list, null, 2));
  return newRecord;
}

export function updateSourceStatus(id: string, status: SourceRecord["status"]): void {
  ensureDb();
  const raw = fs.readFileSync(SOURCES_FILE, "utf-8");
  const list: SourceRecord[] = JSON.parse(raw);
  const src = list.find((s) => s.id === id);
  if (src) {
    src.status = status;
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(list, null, 2));
  }
}

export function deleteSource(id: string, userId: string): boolean {
  ensureDb();
  const raw = fs.readFileSync(SOURCES_FILE, "utf-8");
  let list: SourceRecord[] = JSON.parse(raw);
  const initialLength = list.length;
  list = list.filter((s) => !(s.id === id && s.userId === userId));

  if (list.length !== initialLength) {
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(list, null, 2));
    return true;
  }
  return false;
}
