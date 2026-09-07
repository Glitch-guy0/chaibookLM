/**
 * Text Extractor (AC-2.3.5)
 * Direct standardization of raw text input into normalized Markdown.
 */
export function normalizeTextToMarkdown(content: string): string {
  if (!content) return '';
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}
