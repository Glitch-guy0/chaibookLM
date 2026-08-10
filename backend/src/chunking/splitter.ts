import { createHash } from 'node:crypto';

export const CHUNK_SIZE = 500;
export const CHUNK_OVERLAP = 125; // 25% of CHUNK_SIZE

export interface SplitChunk {
  span: { start: number; end: number };
  position: number;
  text: string;
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

/** Split plain text into span-preserving chunks with sequential positions. */
export function splitPlainText(text: string): SplitChunk[] {
  return splitFixed(text).map((c, i) => ({ ...c, position: i }));
}

/**
 * Split markdown into non-overlapping heading sections on ATX heading
 * boundaries (`#` through `######`), then apply the fixed-size rule within
 * each section so no chunk crosses a section boundary. Positions continue
 * globally across the whole document.
 */
export function splitMarkdown(text: string): SplitChunk[] {
  const result: SplitChunk[] = [];
  let position = 0;
  for (const section of splitIntoHeadingSections(text)) {
    for (const chunk of splitFixed(section.text)) {
      result.push({
        span: {
          start: section.start + chunk.span.start,
          end: section.start + chunk.span.end,
        },
        position,
        text: chunk.text,
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
    if (/^#{1,6}\s+/.test(line)) {
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
  return sections;
}

/** Deterministic, idempotent chunk id derived from sourceId + position. */
export function chunkId(sourceId: string, position: number): string {
  return createHash('sha256')
    .update(`${sourceId}:${position}`)
    .digest('hex')
    .slice(0, 32);
}
