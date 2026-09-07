import { createHash } from 'node:crypto';

export const CHUNK_SIZE = 500;
export const CHUNK_OVERLAP = 125; // 25% of CHUNK_SIZE

export interface SplitChunk {
  span: { start: number; end: number };
  position: number;
  text: string;
  excerpt?: string;
  metadata?: {
    pageNumber?: number;
    timestampSeconds?: number;
    link?: string;
    excerpt?: string;
    [key: string]: any;
  };
}

interface RawChunk {
  span: { start: number; end: number };
  text: string;
}

/**
 * Deterministic fixed-size splitter. Scans the string forward, emitting
 * CHUNK_SIZE slices with CHUNK_OVERLAP characters of overlap. A final partial
 * chunk is emitted when trailing text remains. Spans are relative to `text`.
 */
function splitFixed(text: string): RawChunk[] {
  if (text.length === 0) return [];
  const chunks: RawChunk[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push({ span: { start, end }, text: text.slice(start, end) });
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

/**
 * Extracts anchor metadata (pageNumber from <!-- page: N --> and
 * timestampSeconds from <!-- time: mm:ss -->) associated with the chunk.
 */
export function extractAnchorMetadata(prefixAndChunkText: string, chunkText: string): {
  pageNumber?: number;
  timestampSeconds?: number;
  excerpt: string;
} {
  const pageMatches = [...prefixAndChunkText.matchAll(/<!--\s*page:\s*(\d+)\s*-->/gi)];
  const lastPageMatch = pageMatches.length > 0 ? pageMatches[pageMatches.length - 1] : null;
  const pageNumber = lastPageMatch ? parseInt(lastPageMatch[1], 10) : undefined;

  const timeMatches = [
    ...prefixAndChunkText.matchAll(
      /<!--\s*time:\s*(?:(?:(\d{1,2}):)?(\d{1,2}):(\d{2})|(\d{1,3}):(\d{2}))\s*-->/gi,
    ),
  ];
  let timestampSeconds: number | undefined;
  if (timeMatches.length > 0) {
    const lastTime = timeMatches[timeMatches.length - 1];
    if (lastTime[4] !== undefined && lastTime[5] !== undefined) {
      timestampSeconds = parseInt(lastTime[4], 10) * 60 + parseInt(lastTime[5], 10);
    } else if (lastTime[2] !== undefined && lastTime[3] !== undefined) {
      const hrs = lastTime[1] ? parseInt(lastTime[1], 10) : 0;
      timestampSeconds = hrs * 3600 + parseInt(lastTime[2], 10) * 60 + parseInt(lastTime[3], 10);
    }
  }

  const excerpt = chunkText
    .replace(/<!--.*?-->/gs, '')
    .trim()
    .slice(0, 160)
    .trim();

  return {
    pageNumber,
    timestampSeconds,
    excerpt,
  };
}

/** Split plain text into span-preserving chunks with sequential positions. */
export function splitPlainText(text: string): SplitChunk[] {
  return splitFixed(text).map((c, i) => ({
    ...c,
    position: i,
    excerpt: c.text.slice(0, 160).trim(),
    metadata: { excerpt: c.text.slice(0, 160).trim() },
  }));
}

/**
 * Split markdown into non-overlapping heading sections on ATX heading
 * boundaries (`#` through `######`), then apply the fixed-size rule within
 * each section so no chunk crosses a section boundary. Preserves anchor
 * metadata (pageNumber, timestampSeconds, excerpt).
 */
export function splitMarkdown(text: string): SplitChunk[] {
  const result: SplitChunk[] = [];
  let position = 0;
  for (const section of splitIntoHeadingSections(text)) {
    for (const chunk of splitFixed(section.text)) {
      const start = section.start + chunk.span.start;
      const end = section.start + chunk.span.end;
      const prefixText = text.slice(0, end);
      const anchors = extractAnchorMetadata(prefixText, chunk.text);

      const metadata: Record<string, any> = {
        excerpt: anchors.excerpt,
      };
      if (anchors.pageNumber !== undefined) metadata.pageNumber = anchors.pageNumber;
      if (anchors.timestampSeconds !== undefined) metadata.timestampSeconds = anchors.timestampSeconds;

      result.push({
        span: { start, end },
        position,
        text: chunk.text,
        excerpt: anchors.excerpt,
        metadata,
      });
      position++;
    }
  }
  return result;
}

interface Section {
  start: number;
  text: string;
}

function splitIntoHeadingSections(text: string): Section[] {
  const sections: Section[] = [];
  const lines = text.split('\n');
  let currentStart = 0;
  let offset = 0;
  for (const line of lines) {
    if (/^(?:#{1,6}\s+|<!--\s*(?:page|time):)/i.test(line)) {
      if (offset > currentStart) {
        sections.push({
          start: currentStart,
          text: text.slice(currentStart, offset),
        });
      }
      currentStart = offset;
    }
    offset += line.length + 1;
  }
  sections.push({ start: currentStart, text: text.slice(currentStart) });
  return sections.filter((s) => s.text.trim().length > 0);
}

/** Deterministic, idempotent chunk id derived from sourceId + position. */
export function chunkId(sourceId: string, position: number): string {
  return createHash('sha256')
    .update(`${sourceId}:${position}`)
    .digest('hex')
    .slice(0, 32);
}
