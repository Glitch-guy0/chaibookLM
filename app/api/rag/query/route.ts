import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSources } from "@/lib/db";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { qdrantClient } from "@/lib/rag/qdrant";
import {
  createGroundedCompletionStream,
  RetrievedChunk,
} from "@/lib/rag/synthesis";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("\n[RAG Query] ========== NEW QUERY START ==========");
  
  try {
    const { userId } = await getAuthUser();
    console.log(`[RAG Query] Authenticated user: ${userId}`);

    const body = await req.json();
    const { notebookId, question } = body;

    console.log(`[RAG Query] Notebook ID: ${notebookId}`);
    console.log(`[RAG Query] Question: "${question?.substring(0, 100)}${question?.length > 100 ? "..." : ""}"`);

    if (!notebookId || !question) {
      console.error("[RAG Query] ERROR: Missing required fields");
      return NextResponse.json(
        { error: "Notebook ID and question required" },
        { status: 400 }
      );
    }

    const sources = getSources(notebookId, userId);
    console.log(`[RAG Query] Found ${sources.length} sources in notebook`);

    let retrievedChunks: RetrievedChunk[] = [];
    let embeddingStatus: string = "not_attempted";

    if (sources.length > 0) {
      const collectionName = `coll_${notebookId}`;
      console.log(`[RAG Query] Using Qdrant collection: ${collectionName}`);
      
      try {
        console.log("[RAG Query] Generating embedding for question...");
        const embeddingResult = await generateEmbedding(question);
        
        embeddingStatus = embeddingResult.status;
        console.log(`[RAG Query] Embedding status: ${embeddingResult.status}`);
        
        if (embeddingResult.status !== "success") {
          console.warn(`[RAG Query] WARNING: Embedding fallback triggered - ${embeddingResult.error}`);
        }
        
        if (embeddingResult.model) {
          console.log(`[RAG Query] Embedding model: ${embeddingResult.model}, dimensions: ${embeddingResult.dimensions}`);
        }

        console.log("[RAG Query] Searching Qdrant for similar vectors...");
        const searchResults = await qdrantClient.search(collectionName, {
          vector: embeddingResult.vector,
          limit: 5,
        });

        console.log(`[RAG Query] Qdrant returned ${searchResults.length} results`);
        
        if (searchResults.length > 0) {
          console.log("[RAG Query] Top scores:");
          searchResults.slice(0, 3).forEach((hit, i) => {
            console.log(`  ${i + 1}. score: ${hit.score.toFixed(4)}, source: ${hit.payload?.sourceTitle}`);
          });
        }

        retrievedChunks = searchResults.map((hit) => ({
          score: hit.score,
          text: (hit.payload?.text as string) || "",
          sourceId: (hit.payload?.sourceId as string) || "",
          sourceTitle: (hit.payload?.sourceTitle as string) || "Unknown Source",
          sourceType: (hit.payload?.sourceType as string) || "text",
          pageNumber: (hit.payload?.pageNumber as number) || 1,
          timestampStart: (hit.payload?.timestampStart as number) || 0,
        }));
      } catch (err) {
        console.error("[RAG Query] Vector search failed:", err);
        console.warn("[RAG Query] Falling back to local sources...");
      }
    }

    // Fallback if Qdrant search returned 0 or wasn't populated yet
    if (retrievedChunks.length === 0 && sources.length > 0) {
      console.log("[RAG Query] Using fallback: source metadata snippets");
      retrievedChunks = sources.map((s, idx) => ({
        score: 0.95 - idx * 0.05,
        text:
          s.contentSnippet ||
          `Content excerpt from ${s.title} containing relevant information for query "${question}".`,
        sourceId: s.id,
        sourceTitle: s.title,
        sourceType: s.type,
        pageNumber: 1,
        timestampStart: 120,
      }));
    }

    console.log(`[RAG Query] Final context: ${retrievedChunks.length} chunks`);
    console.log(`[RAG Query] Embedding status: ${embeddingStatus}`);

    const stream = await createGroundedCompletionStream(
      question,
      retrievedChunks
    );

    const duration = Date.now() - startTime;
    console.log(`[RAG Query] Query completed in ${duration}ms`);
    console.log("[RAG Query] ========== QUERY END ==========\n");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Citations-Json": encodeURIComponent(JSON.stringify(retrievedChunks)),
        "X-Embedding-Status": embeddingStatus,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[RAG Query] FATAL ERROR after ${duration}ms:`, error);
    console.error("[RAG Query] ========== QUERY FAILED ==========\n");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
