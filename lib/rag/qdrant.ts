import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;

console.log("[Qdrant] Configuration:");
console.log(`  - URL: ${QDRANT_URL}`);
console.log(`  - API Key: ${QDRANT_API_KEY ? "SET" : "NOT SET"}`);

export const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  checkCompatibility: false,
});

export async function ensureCollection(collectionName: string, vectorSize: number = 1536) {
  try {
    console.log(`[Qdrant] Checking collection: ${collectionName} (vector size: ${vectorSize})`);
    const result = await qdrantClient.getCollections();
    const exists = result.collections.some((c) => c.name === collectionName);
    
    if (!exists) {
      console.log(`[Qdrant] Creating collection: ${collectionName}`);
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Collection created successfully`);
    } else {
      console.log(`[Qdrant] Collection already exists`);
    }
  } catch (error) {
    console.error(`[Qdrant] ERROR ensuring collection ${collectionName}:`, error);
    throw error;
  }
}
