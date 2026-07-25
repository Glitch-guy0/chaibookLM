export interface DocumentChunk {
  chunkIndex: number;
  text: string;
  metadata: {
    pageNumber?: number;
    timestampStart?: number;
    timestampEnd?: number;
    sectionTitle?: string;
    sourceTitle: string;
    sourceType: string;
  };
}

export function chunkText(
  text: string,
  sourceTitle: string,
  sourceType: string,
  chunkSize: number = 500,
  overlap: number = 50
): DocumentChunk[] {
  const words = text.split(/\s+/);
  const chunks: DocumentChunk[] = [];
  let index = 0;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize);
    if (chunkWords.length === 0) break;

    const chunkTextStr = chunkWords.join(" ");
    chunks.push({
      chunkIndex: index++,
      text: chunkTextStr,
      metadata: {
        sourceTitle,
        sourceType,
        pageNumber: Math.floor(i / 300) + 1,
        timestampStart: Math.floor((i / 150) * 10),
      },
    });
  }

  return chunks;
}
