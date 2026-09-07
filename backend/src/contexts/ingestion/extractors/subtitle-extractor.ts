/**
 * Subtitle Extractor (AC-2.3.4)
 * Parses .srt and .vtt subtitle content using regex into standardized Markdown
 * with <!-- time: mm:ss --> timestamp anchors.
 */
export function parseSubtitlesToMarkdown(content: string): string {
  if (!content || !content.trim()) return '';

  // Remove WEBVTT header and comments if present
  let clean = content.replace(/^WEBVTT[^\n]*\n+/i, '').replace(/NOTE[^\n]*\n+/gi, '');

  // Regex matching timestamp lines like 00:01:23,456 --> 00:01:26,789 or 01:23.456 --> 01:26.789
  const timestampRegex =
    /(?:(\d{2}):)?(\d{2}):(\d{2})[,.]\d{3}\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[,.]\d{3}/g;

  // Split blocks separated by double newlines or single newlines with index counters
  const blocks = clean.split(/\n\s*\n/);
  const normalizedLines: string[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Find the timestamp line
    let timeMatch: RegExpExecArray | null = null;
    let textStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const match = timestampRegex.exec(lines[i]);
      timestampRegex.lastIndex = 0; // reset
      if (match) {
        timeMatch = match;
        textStartIndex = i + 1;
        break;
      }
    }

    if (!timeMatch) continue;

    const hours = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0;
    const minutes = parseInt(timeMatch[2], 10) + hours * 60;
    const seconds = parseInt(timeMatch[3], 10);

    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const dialogue = lines.slice(textStartIndex).join(' ').replace(/<[^>]+>/g, '').trim();

    if (dialogue) {
      normalizedLines.push(`<!-- time: ${formattedTime} --> ${dialogue}`);
    }
  }

  return normalizedLines.join('\n\n');
}
