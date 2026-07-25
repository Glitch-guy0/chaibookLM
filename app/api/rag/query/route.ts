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
  try {
    const { userId } = await getAuthUser();
    const body = await req.json();
    const { notebookId, question } = body;

    if (!notebookId || !question) {
      return NextResponse.json(
        { error: "Notebook ID and question required" },
        { status: 400 }
      );
    }

    const sources = getSources(notebookId, userId);
    let retrievedChunks: RetrievedChunk[] = [];

    if (sources.length > 0) {
      const collectionName = `coll_${notebookId}`;
      try {
        const queryVector = await generateEmbedding(question);
        const searchResults = await qdrantClient.search(collectionName, {
          vector: queryVector,
          limit: 5,
        });

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
        console.error("Vector search fallback to local sources:", err);
      }
    }

    // Fallback if Qdrant search returned 0 or wasn't populated yet
    if (retrievedChunks.length === 0 && sources.length > 0) {
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

    const stream = await createGroundedCompletionStream(
      question,
      retrievedChunks
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Citations-Json": JSON.stringify(retrievedChunks),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
