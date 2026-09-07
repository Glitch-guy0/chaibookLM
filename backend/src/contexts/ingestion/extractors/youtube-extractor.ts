export interface TranscriptSnippet {
  text: string;
  start: number; // in seconds
  duration?: number;
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('?')[0] || null;
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

/**
 * YouTube Subtitle Extractor (AC-2.3.3)
 * Fetches captions keylessly via transcript parsing with <!-- time: mm:ss --> anchors.
 * Fails immediately with "No captions found for this video" if captions are absent.
 */
export async function parseYouTubeCaptionsToMarkdown(
  urlOrContent: string,
  fetchTranscriptFn?: (videoId: string) => Promise<TranscriptSnippet[] | null>,
): Promise<string> {
  const videoId = extractYouTubeVideoId(urlOrContent);

  // If content is already parsed or passed as mock transcript payload
  if (!videoId && urlOrContent.includes('-->')) {
    const { parseSubtitlesToMarkdown } = await import('./subtitle-extractor');
    return parseSubtitlesToMarkdown(urlOrContent);
  }

  if (!videoId) {
    throw new Error('No captions found for this video');
  }

  let snippets: TranscriptSnippet[] | null = null;
  if (fetchTranscriptFn) {
    snippets = await fetchTranscriptFn(videoId);
  } else {
    // Attempt keyless transcript fetch or fallback
    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
        signal: AbortSignal.timeout(5000),
      });
      const html = await res.text();
      const captionMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
      if (!captionMatch) {
        throw new Error('No captions found for this video');
      }
      // If found captionTracks, parse first track
      const tracks = JSON.parse(captionMatch[1]);
      if (!tracks || tracks.length === 0 || !tracks[0].baseUrl) {
        throw new Error('No captions found for this video');
      }
      const trackRes = await fetch(tracks[0].baseUrl);
      const trackXml = await trackRes.text();
      // Parse <text start="12.34" dur="2.5">words</text>
      const textMatches = [...trackXml.matchAll(/<text start="([\d.]+)"[^>]*>(.*?)<\/text>/g)];
      if (textMatches.length === 0) {
        throw new Error('No captions found for this video');
      }
      snippets = textMatches.map((m) => ({
        start: parseFloat(m[1]),
        text: m[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim(),
      }));
    } catch (err: any) {
      if (err?.message === 'No captions found for this video') throw err;
      throw new Error('No captions found for this video');
    }
  }

  if (!snippets || snippets.length === 0) {
    throw new Error('No captions found for this video');
  }

  const lines: string[] = [];
  for (const s of snippets) {
    const totalSecs = Math.floor(s.start);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    lines.push(`<!-- time: ${timeStr} --> ${s.text}`);
  }

  return lines.join('\n\n');
}
