const EMBEDDING_MODEL_BASE_URL =
  process.env.EMBEDDING_MODEL_BASE_URL || "https://api.openai.com/v1";
const EMBEDDING_MODEL_NAME =
  process.env.EMBEDDING_MODEL_NAME || "text-embedding-3-small";
const EMBEDDING_MODEL_API_KEY =
  process.env.EMBEDDING_MODEL_API_KEY || process.env.MAIN_MODEL_API_KEY || "";

export interface EmbeddingResult {
  vector: number[];
  status: "success" | "fallback_api_key" | "fallback_error" | "fallback_rate_limit";
  error?: string;
  model?: string;
  dimensions?: number;
}

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

function isApiKeyInvalid(): boolean {
  return (
    !EMBEDDING_MODEL_API_KEY ||
    EMBEDDING_MODEL_API_KEY.includes("your_") ||
    EMBEDDING_MODEL_API_KEY === "placeholder"
  );
}

function logEmbeddingConfig(): void {
  console.log("[Embeddings] Configuration:");
  console.log(`  - Base URL: ${EMBEDDING_MODEL_BASE_URL}`);
  console.log(`  - Model: ${EMBEDDING_MODEL_NAME}`);
  console.log(`  - API Key: ${EMBEDDING_MODEL_API_KEY ? "SET" : "NOT SET"}`);
  console.log(`  - API Key valid: ${!isApiKeyInvalid()}`);
}

let configLogged = false;

export async function generateEmbedding(
  text: string,
  targetDim: number = 1536
): Promise<EmbeddingResult> {
  if (!configLogged) {
    logEmbeddingConfig();
    configLogged = true;
  }

  const textPreview = text.substring(0, 50) + (text.length > 50 ? "..." : "");
  console.log(`[Embeddings] Generating embedding for text: "${textPreview}" (length: ${text.length})`);

  if (isApiKeyInvalid()) {
    console.warn("[Embeddings] FALLBACK: API key is missing or placeholder. Using random vector.");
    console.warn("[Embeddings] To fix: Set EMBEDDING_MODEL_API_KEY in .env file");
    return {
      vector: getFallbackVector(targetDim),
      status: "fallback_api_key",
      error: "API key missing or placeholder",
    };
  }

  try {
    const truncatedText = text.substring(0, 4000);
    if (truncatedText.length < text.length) {
      console.log(`[Embeddings] Text truncated: ${text.length} -> ${truncatedText.length} chars`);
    }

    const endpointUrl = EMBEDDING_MODEL_BASE_URL.endsWith("/embeddings")
      ? EMBEDDING_MODEL_BASE_URL
      : `${EMBEDDING_MODEL_BASE_URL.replace(/\/+$/, "")}/embeddings`;

    console.log(`[Embeddings] Calling API: ${endpointUrl}`);
    
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMBEDDING_MODEL_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL_NAME,
        messages: [{ role: "user", content: truncatedText }],
        input: truncatedText,
      }),
    });

    console.log(`[Embeddings] API response status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Could not read error body");
      console.error(`[Embeddings] API ERROR (${res.status}): ${res.statusText}`);
      console.error(`[Embeddings] Error body: ${errorBody}`);

      let status: EmbeddingResult["status"] = "fallback_error";
      if (res.status === 429) {
        status = "fallback_rate_limit";
        console.error("[Embeddings] RATE LIMITED - Too many requests. Consider reducing embedding frequency.");
      } else if (res.status === 401) {
        console.error("[Embeddings] AUTH FAILED - Check your API key.");
      } else if (res.status === 403) {
        console.error("[Embeddings] FORBIDDEN - Model not available for your account.");
      } else if (res.status === 404) {
        console.error(`[Embeddings] NOT FOUND - Model '${EMBEDDING_MODEL_NAME}' or endpoint not found.`);
      }

      return {
        vector: getFallbackVector(targetDim),
        status,
        error: `API error: ${res.status} ${res.statusText}`,
      };
    }

    const data = await res.json();
    console.log(`[Embeddings] API response received, parsing vector...`);

    const rawVector = data?.data?.[0]?.embedding || data?.embedding;

    if (Array.isArray(rawVector) && rawVector.length > 0) {
      const vector = normalizeDimension(rawVector, targetDim);
      console.log(`[Embeddings] SUCCESS: Vector generated (${vector.length} dimensions)`);
      return {
        vector,
        status: "success",
        model: EMBEDDING_MODEL_NAME,
        dimensions: vector.length,
      };
    }

    console.error("[Embeddings] FALLBACK: Invalid response format - no embedding vector found");
    console.error("[Embeddings] Response data:", JSON.stringify(data).substring(0, 500));
    return {
      vector: getFallbackVector(targetDim),
      status: "fallback_error",
      error: "No embedding vector in response",
    };
  } catch (error) {
    console.error("[Embeddings] FALLBACK: Network or runtime error:", error);
    return {
      vector: getFallbackVector(targetDim),
      status: "fallback_error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
