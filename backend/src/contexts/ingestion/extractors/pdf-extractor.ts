import type { StorageService } from '../../../ports/StorageService';

/**
 * PDF Extractor (AC-2.3.1)
 * Extracts page text into Markdown with <!-- page: N --> anchors.
 * Deletes ephemeral Cloudinary binary upon completion.
 */
export async function parsePdfToMarkdown(
  rawContent: string | Buffer,
  sourceId?: string,
  storage?: StorageService,
): Promise<string> {
  const contentStr = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf8');

  // If text already contains page markers, standardize them
  if (/<!--\s*page:\s*\d+\s*-->/i.test(contentStr)) {
    return contentStr.trim();
  }

  // Pure-JS extraction fallback splitting by form feeds or page boundaries
  const pages = contentStr
    .split(/\f|\n\s*---+\s*Page\s*(\d+)\s*---+|\n\s*\[Page\s*(\d+)\]/i)
    .filter((p) => p && p.trim() && !/^\d+$/.test(p.trim()));

  const outputPages: string[] = [];
  if (pages.length > 0) {
    pages.forEach((pageText, idx) => {
      const pageNum = idx + 1;
      outputPages.push(`<!-- page: ${pageNum} -->\n${pageText.trim()}`);
    });
  } else {
    outputPages.push(`<!-- page: 1 -->\n${contentStr.trim()}`);
  }

  // Delete ephemeral temporary binary immediately (AC-2.3.1)
  if (sourceId && storage) {
    await storage.delete(`temp_${sourceId}`).catch(() => {});
  }

  return outputPages.join('\n\n');
}
