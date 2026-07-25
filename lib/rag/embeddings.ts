const EMBEDDING_MODEL_BASE_URL =
  process.env.EMBEDDING_MODEL_BASE_URL || "https://api.openai.com/v1";
const EMBEDDING_MODEL_NAME =
  process.env.EMBEDDING_MODEL_NAME || "text-embedding-3-small";
const EMBEDDING_MODEL_API_KEY =
  process.env.EMBEDDING_MODEL_API_KEY || process.env.MAIN_MODEL_API_KEY || "";

function getFallbackVector(): number[] {
  return new Array(1536).fill(0).map(() => (Math.random() - 0.5) * 0.1);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // If API key is missing or placeholder, use fallback vector
  if (
    !EMBEDDING_MODEL_API_KEY ||
    EMBEDDING_MODEL_API_KEY.includes("your_") ||
    EMBEDDING_MODEL_API_KEY === "placeholder"
  ) {
    return getFallbackVector();
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
      console.warn(`Embedding API warning (${res.status}): ${res.statusText}`);
      return getFallbackVector();
    }

    const data = await res.json();
    const vector = data?.data?.[0]?.embedding || data?.embedding;

    if (Array.isArray(vector) && vector.length > 0) {
      return vector;
    }

    return getFallbackVector();
  } catch (error) {
    console.error("Embedding generation fallback:", error);
    return getFallbackVector();
  }
}
