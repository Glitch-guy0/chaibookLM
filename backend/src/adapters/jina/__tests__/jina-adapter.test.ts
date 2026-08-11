import { describe, expect, it } from 'vitest';
import { parseSearchMarkdown } from '../index';

describe('parseSearchMarkdown', () => {
  it('parses a well-formed numbered block list', () => {
    const markdown = [
      '[1] Title: First Result',
      '[1] URL Source: https://example.com/first',
      '[1] Description: First snippet',
      '',
      '[2] Title: Second Result',
      '[2] URL Source: https://example.com/second',
      '[2] Description: Second snippet',
    ].join('\n');

    expect(parseSearchMarkdown(markdown)).toEqual([
      { title: 'First Result', url: 'https://example.com/first', content: 'First snippet' },
      { title: 'Second Result', url: 'https://example.com/second', content: 'Second snippet' },
    ]);
  });

  it('preserves numeric ordering even when blocks arrive out of order', () => {
    const markdown = [
      '[2] Title: Second',
      '[2] URL Source: https://example.com/second',
      '[1] Title: First',
      '[1] URL Source: https://example.com/first',
    ].join('\n');

    const results = parseSearchMarkdown(markdown);
    expect(results.map((r) => r.title)).toEqual(['First', 'Second']);
  });

  it('skips a block missing a title', () => {
    const markdown = [
      '[1] URL Source: https://example.com/no-title',
      '[1] Description: has url but no title',
    ].join('\n');

    expect(parseSearchMarkdown(markdown)).toEqual([]);
  });

  it('skips a block missing a url', () => {
    const markdown = ['[1] Title: No URL Here', '[1] Description: has title but no url'].join(
      '\n',
    );

    expect(parseSearchMarkdown(markdown)).toEqual([]);
  });

  it('defaults content to an empty string when Description is absent', () => {
    const markdown = ['[1] Title: No Description', '[1] URL Source: https://example.com/x'].join(
      '\n',
    );

    expect(parseSearchMarkdown(markdown)).toEqual([
      { title: 'No Description', url: 'https://example.com/x', content: '' },
    ]);
  });

  it('ignores unrecognized lines and returns an empty array for garbage input', () => {
    const markdown = 'not a recognized format\njust plain text\n123 no brackets here';
    expect(parseSearchMarkdown(markdown)).toEqual([]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseSearchMarkdown('')).toEqual([]);
  });
});
