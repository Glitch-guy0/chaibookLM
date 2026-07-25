import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;

export const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  checkCompatibility: false,
});

export async function ensureCollection(collectionName: string, vectorSize: number = 1536) {
  try {
    const result = await qdrantClient.getCollections();
    const exists = result.collections.some((c) => c.name === collectionName);
    if (!exists) {
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      });
    }
  } catch (error) {
    console.error("Qdrant ensureCollection error:", error);
  }
}
