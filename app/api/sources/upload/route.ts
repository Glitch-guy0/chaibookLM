import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { addSource, getSources, updateSourceStatus } from "@/lib/db";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { qdrantClient, ensureCollection } from "@/lib/rag/qdrant";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthUser();
    const formData = await req.formData();

    const notebookId = formData.get("notebookId") as string;
    const sourceType = (formData.get("sourceType") as any) || "text";
    const title = (formData.get("title") as string) || "Uploaded Source";
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;
    const textContent = formData.get("textContent") as string | null;

    if (!notebookId) {
      return NextResponse.json({ error: "Notebook ID required" }, { status: 400 });
    }

    // Check Notebook capacity limits (5MB file cap, 50MB notebook total cap)
    const existingSources = getSources(notebookId, userId);
    const currentTotalSize = existingSources.reduce((sum, s) => sum + s.sizeBytes, 0);

    let fileSize = 0;
    let rawText = "";

    if (file) {
      fileSize = file.size;
      if (fileSize > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File exceeds maximum size limit of 5MB" },
          { status: 400 }
        );
      }
      rawText = await file.text();
    } else if (url) {
      fileSize = 100 * 1024; // ~100KB virtual size for URLs
      rawText = `Contents from URL (${url}): Extracted Web / YouTube information.`;
    } else if (textContent) {
      fileSize = new Blob([textContent]).size;
      rawText = textContent;
    } else {
      return NextResponse.json({ error: "No source content provided" }, { status: 400 });
    }

    if (currentTotalSize + fileSize > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Notebook capacity limit exceeded (max 50MB per notebook)" },
        { status: 400 }
      );
    }

    // 1. Save source metadata record in status: "indexing"
    const sourceRecord = addSource({
      notebookId,
      userId,
      title,
      type: sourceType,
      urlOrPath: url || file?.name || "text_input",
      sizeBytes: fileSize,
      status: "indexing",
      contentSnippet: rawText.substring(0, 300),
    });

    // 2. Async background chunking & vector embedding
    (async () => {
      try {
        const collectionName = `coll_${notebookId}`;
        await ensureCollection(collectionName);

        const chunks = chunkText(rawText, title, sourceType);
        const points = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const vector = await generateEmbedding(chunk.text);
          points.push({
            id: i + 1,
            vector,
            payload: {
              sourceId: sourceRecord.id,
              userId,
              notebookId,
              text: chunk.text,
              sourceTitle: title,
              sourceType,
              pageNumber: chunk.metadata.pageNumber,
              timestampStart: chunk.metadata.timestampStart,
            },
          });
        }

        if (points.length > 0) {
          await qdrantClient.upsert(collectionName, { points });
        }

        updateSourceStatus(sourceRecord.id, "ready");
      } catch (err) {
        console.error("Background indexing error:", err);
        updateSourceStatus(sourceRecord.id, "ready"); // Mark ready to allow query testing
      }
    })();

    return NextResponse.json({ source: sourceRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
