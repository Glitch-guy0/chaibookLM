import { describe, expect, it, vi } from 'vitest';
import {
  parsePdfToMarkdown,
  parseSubtitlesToMarkdown,
  parseYouTubeCaptionsToMarkdown,
  normalizeTextToMarkdown,
} from '../extractors/index';

describe('Story 2.3: Multi-Modal Content Extractors & Markdown Normalization', () => {
  describe('PDF Extractor (AC-2.3.1)', () => {
    it('parses multi-page content into Markdown with <!-- page: N --> anchors and deletes temp binary', async () => {
      const mockStorage = {
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const rawPdfText = 'First page text\fSecond page text\fThird page text';
      const result = await parsePdfToMarkdown(rawPdfText, 'source-pdf-1', mockStorage as any);

      expect(result).toContain('<!-- page: 1 -->');
      expect(result).toContain('First page text');
      expect(result).toContain('<!-- page: 2 -->');
      expect(result).toContain('Second page text');
      expect(result).toContain('<!-- page: 3 -->');
      expect(result).toContain('Third page text');

      expect(mockStorage.delete).toHaveBeenCalledWith('temp_source-pdf-1');
    });

    it('preserves existing page anchors in pre-extracted PDF text', async () => {
      const existing = '<!-- page: 1 -->\nPage one text\n\n<!-- page: 2 -->\nPage two text';
      const result = await parsePdfToMarkdown(existing);
      expect(result).toBe(existing);
    });
  });

  describe('Subtitle Extractor (.srt/.vtt) (AC-2.3.4)', () => {
    it('parses .srt subtitles into dialogue Markdown with <!-- time: mm:ss --> anchors', () => {
      const srt = `1
00:01:23,456 --> 00:01:26,789
Welcome back to the neural architecture lecture.

2
00:02:05,100 --> 00:02:08,200
Today we examine sparse transformer attention.`;

      const result = parseSubtitlesToMarkdown(srt);

      expect(result).toContain('<!-- time: 01:23 --> Welcome back to the neural architecture lecture.');
      expect(result).toContain('<!-- time: 02:05 --> Today we examine sparse transformer attention.');
    });

    it('parses .vtt subtitles with WEBVTT headers and formatting tags', () => {
      const vtt = `WEBVTT
NOTE This is a commentary note

00:00:15.000 --> 00:00:18.500
<v Speaker>Here is a test with <b>tags</b>.</v>`;

      const result = parseSubtitlesToMarkdown(vtt);

      expect(result).toContain('<!-- time: 00:15 --> Here is a test with tags.');
    });
  });

  describe('YouTube Extractor (AC-2.3.3)', () => {
    it('parses transcript snippets with <!-- time: mm:ss --> anchors', async () => {
      const mockFetch = vi.fn().mockResolvedValue([
        { start: 12.5, text: 'Hello and welcome to the channel.' },
        { start: 75.2, text: 'Let us jump straight into the implementation.' },
      ]);

      const result = await parseYouTubeCaptionsToMarkdown(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        mockFetch,
      );

      expect(result).toContain('<!-- time: 00:12 --> Hello and welcome to the channel.');
      expect(result).toContain('<!-- time: 01:15 --> Let us jump straight into the implementation.');
    });

    it('throws "No captions found for this video" when captions are absent', async () => {
      const mockFetch = vi.fn().mockResolvedValue([]);

      await expect(
        parseYouTubeCaptionsToMarkdown('https://youtu.be/dQw4w9WgXcQ', mockFetch),
      ).rejects.toThrow('No captions found for this video');
    });
  });

  describe('Text Extractor (AC-2.3.5)', () => {
    it('normalizes line endings and whitespace for raw text input', () => {
      const raw = 'Heading 1\r\n\r\nParagraph text with windows line endings.\r\n';
      const result = normalizeTextToMarkdown(raw);
      expect(result).toBe('Heading 1\n\nParagraph text with windows line endings.');
    });
  });
});
