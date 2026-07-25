const EMBEDDING_MODEL_BASE_URL =
  process.env.EMBEDDING_MODEL_BASE_URL || "https://api.openai.com/v1";
const EMBEDDING_MODEL_NAME =
  process.env.EMBEDDING_MODEL_NAME || "text-embedding-3-small";
const EMBEDDING_MODEL_API_KEY =
  process.env.EMBEDDING_MODEL_API_KEY || process.env.MAIN_MODEL_API_KEY || "";

function getFallbackVector(dim: number = 1536): number[] {
  return new Array(dim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
}

function normalizeDimension(vec: number[], targetDim: number = 1536): number[] {
  if (vec.length === targetDim) return vec;
  if (vec.length > targetDim) return vec.slice(0, targetDim);
  const padded = new Array(targetDim).fill(0);
  for (let i = 0; i < vec.length; i++) padded[i] = vec[i];
  return padded;
}

export async function generateEmbedding(
  text: string,
  targetDim: number = 1536
): Promise<number[]> {
  // If API key is missing or placeholder, return normalized fallback vector
  if (
    !EMBEDDING_MODEL_API_KEY ||
    EMBEDDING_MODEL_API_KEY.includes("your_") ||
    EMBEDDING_MODEL_API_KEY === "placeholder"
  ) {
    return getFallbackVector(targetDim);
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
      return getFallbackVector(targetDim);
    }

    const data = await res.json();
    const rawVector = data?.data?.[0]?.embedding || data?.embedding;

    if (Array.isArray(rawVector) && rawVector.length > 0) {
      return normalizeDimension(rawVector, targetDim);
    }

    return getFallbackVector(targetDim);
  } catch (error) {
    console.error("Embedding generation fallback:", error);
    return getFallbackVector(targetDim);
  }
}
