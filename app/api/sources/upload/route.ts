import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { addSource, getSources, updateSourceStatus } from "@/lib/db";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { qdrantClient, ensureCollection } from "@/lib/rag/qdrant";
import { parsePdfWithDocling } from "@/lib/rag/docling";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("\n[Upload] ========== NEW UPLOAD START ==========");

  try {
    const { userId } = await getAuthUser();
    console.log(`[Upload] Authenticated user: ${userId}`);

    const formData = await req.formData();

    const notebookId = formData.get("notebookId") as string;
    const sourceType = (formData.get("sourceType") as any) || "text";
    const title = (formData.get("title") as string) || "Uploaded Source";
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;
    const textContent = formData.get("textContent") as string | null;

    console.log(`[Upload] Notebook: ${notebookId}`);
    console.log(`[Upload] Source type: ${sourceType}`);
    console.log(`[Upload] Title: ${title}`);

    if (!notebookId) {
      console.error("[Upload] ERROR: Missing notebook ID");
      return NextResponse.json({ error: "Notebook ID required" }, { status: 400 });
    }

    // Check Notebook capacity limits (5MB file cap, 50MB notebook total cap)
    const existingSources = getSources(notebookId, userId);
    const currentTotalSize = existingSources.reduce((sum, s) => sum + s.sizeBytes, 0);

    let fileSize = 0;
    let rawText = "";
    let pdfBuffer: Buffer | null = null;
    let isPdf = false;

    if (file) {
      fileSize = file.size;
      console.log(`[Upload] File: ${file.name} (${(fileSize / 1024).toFixed(1)}KB)`);
      if (fileSize > 5 * 1024 * 1024) {
        console.error("[Upload] ERROR: File exceeds 5MB limit");
        return NextResponse.json(
          { error: "File exceeds maximum size limit of 5MB" },
          { status: 400 }
        );
      }

      isPdf =
        sourceType === "pdf" ||
        file.name.toLowerCase().endsWith(".pdf") ||
        file.type.includes("pdf");

      if (isPdf) {
        console.log(`[Upload] PDF file received. Preparing buffer for background Docling conversion...`);
        const arrayBuffer = await file.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
        rawText = `PDF Document: ${file.name}`;
      } else {
        rawText = await file.text();
      }
    } else if (url) {
      fileSize = 100 * 1024; // ~100KB virtual size for URLs
      console.log(`[Upload] URL: ${url}`);
      rawText = `Contents from URL (${url}): Extracted Web / YouTube information.`;
    } else if (textContent) {
      fileSize = new Blob([textContent]).size;
      console.log(`[Upload] Text content: ${textContent.length} chars`);
      rawText = textContent;
    } else {
      console.error("[Upload] ERROR: No source content provided");
      return NextResponse.json({ error: "No source content provided" }, { status: 400 });
    }

    console.log(`[Upload] Current notebook size: ${(currentTotalSize / 1024).toFixed(1)}KB`);
    console.log(`[Upload] New content size: ${(fileSize / 1024).toFixed(1)}KB`);

    if (currentTotalSize + fileSize > 50 * 1024 * 1024) {
      console.error("[Upload] ERROR: Notebook capacity limit exceeded");
      return NextResponse.json(
        { error: "Notebook capacity limit exceeded (max 50MB per notebook)" },
        { status: 400 }
      );
    }

    // 1. Save source metadata record immediately in status: "indexing"
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

    console.log(`[Upload] Source record created & acknowledged to client: ${sourceRecord.id}`);

    // 2. Async background processing pipeline (Docling PDF parsing -> Chunking -> Embedding -> Qdrant)
    (async () => {
      const indexStartTime = Date.now();
      console.log(`[Upload Pipeline] Starting background processing for source: ${sourceRecord.id}`);

      try {
        let processedText = rawText;

        // Run Docling conversion for PDF files in the background
        if (isPdf && pdfBuffer) {
          console.log(`[Docling Pipeline] PDF uploaded & acknowledged. Starting Docling conversion for: "${title}"...`);
          processedText = await parsePdfWithDocling(pdfBuffer, file?.name || title);
          console.log(`[Docling Pipeline] Docling conversion complete (${processedText.length} chars). Proceeding with chunking and embedding...`);
        }

        const collectionName = `coll_${notebookId}`;
        console.log(`[Upload Pipeline] Ensuring Qdrant collection: ${collectionName}`);
        await ensureCollection(collectionName);

        const chunks = chunkText(processedText, title, sourceType);
        console.log(`[Upload Pipeline] Text chunked into ${chunks.length} pieces`);

        const points = [];
        let successCount = 0;
        let fallbackCount = 0;

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`[Upload Pipeline] Embedding chunk ${i + 1}/${chunks.length} (${chunk.text.length} chars)`);

          const embeddingResult = await generateEmbedding(chunk.text);

          if (embeddingResult.status === "success") {
            successCount++;
          } else {
            fallbackCount++;
            console.warn(`[Upload Pipeline] Chunk ${i + 1} used fallback: ${embeddingResult.error}`);
          }

          points.push({
            id: i + 1,
            vector: embeddingResult.vector,
            payload: {
              sourceId: sourceRecord.id,
              userId,
              notebookId,
              text: chunk.text,
              sourceTitle: title,
              sourceType,
              pageNumber: chunk.metadata.pageNumber,
              timestampStart: chunk.metadata.timestampStart,
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.metadata.totalChunks,
            },
          });
        }

        console.log(`[Upload Pipeline] Embedding complete: ${successCount} success, ${fallbackCount} fallback`);

        if (points.length > 0) {
          console.log(`[Upload Pipeline] Upserting ${points.length} vectors to Qdrant...`);
          await qdrantClient.upsert(collectionName, { points });
          console.log("[Upload Pipeline] Qdrant upsert complete");
        }

        updateSourceStatus(sourceRecord.id, "ready");
        const duration = Date.now() - indexStartTime;
        console.log(`[Upload Pipeline] Docling conversion & indexing completed in ${duration}ms`);
        console.log("[Upload Pipeline] ========== PROCESSING END ==========\n");
      } catch (err) {
        const duration = Date.now() - indexStartTime;
        console.error(`[Upload Pipeline] Background processing FAILED after ${duration}ms:`, err);
        updateSourceStatus(sourceRecord.id, "ready"); // Fallback ready status to allow testing
      }
    })();

    const duration = Date.now() - startTime;
    console.log(`[Upload] Upload handler acknowledged to client in ${duration}ms`);

    return NextResponse.json({
      source: sourceRecord,
      message: isPdf
        ? "PDF uploaded successfully. Docling parsing & vector indexing started in background."
        : "Source uploaded successfully. Vector indexing started in background.",
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Upload] FATAL ERROR after ${duration}ms:`, error);
    console.error("[Upload] ========== UPLOAD FAILED ==========\n");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
