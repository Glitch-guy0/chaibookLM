const EMBEDDING_MODEL_BASE_URL =
  process.env.EMBEDDING_MODEL_BASE_URL || "https://api.openai.com/v1";
const EMBEDDING_MODEL_NAME =
  process.env.EMBEDDING_MODEL_NAME || "text-embedding-3-small";
const EMBEDDING_MODEL_API_KEY =
  process.env.EMBEDDING_MODEL_API_KEY || process.env.MAIN_MODEL_API_KEY || "";

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!EMBEDDING_MODEL_API_KEY) {
    // Return dummy 1536-dim vector if no API key present for testing
    return new Array(1536).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }

  try {
    const res = await fetch(`${EMBEDDING_MODEL_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMBEDDING_MODEL_API_KEY}`,
      },
      body: JSON.stringify({
        input: text.substring(0, 4000),
        model: EMBEDDING_MODEL_NAME,
      }),
    });

    if (!res.ok) {
      throw new Error(`Embedding API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation fallback:", error);
    return new Array(1536).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }
}
