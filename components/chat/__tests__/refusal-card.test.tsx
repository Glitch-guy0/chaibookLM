import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RefusalCard } from '../refusal-card';

describe('Story 3.4: Grounded Boundary Detection, Honest Refusal & Tavily Web Search Fallback', () => {
  it('renders RefusalCard with warning border and exact refusal copy', () => {
    const html = renderToStaticMarkup(
      <RefusalCard
        credits={5}
        onSearchWebAndAnswer={vi.fn()}
      />
    );

    expect(html).toContain('data-testid="refusal-card"');
    expect(html).toContain('The uploaded sources do not specify the requested information.');
    expect(html).toContain('Search the live web via Tavily? (Consumes 1 credit)');
    expect(html).toContain('Search Web &amp; Answer');
  });

  it('enables the [Search Web & Answer] button when credits > 0', () => {
    const html = renderToStaticMarkup(
      <RefusalCard
        credits={2}
        onSearchWebAndAnswer={vi.fn()}
      />
    );

    expect(html).toContain('Search Web &amp; Answer');
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('credit reset notice');
  });

  it('disables the [Search Web & Answer] button and displays credit reset notice when credits is 0', () => {
    const html = renderToStaticMarkup(
      <RefusalCard
        credits={0}
        onSearchWebAndAnswer={vi.fn()}
      />
    );

    expect(html).toContain('disabled');
    expect(html).toContain('0 credits remaining');
    expect(html).toContain('reset');
  });

  it('renders pending state while web search is in-flight', () => {
    const html = renderToStaticMarkup(
      <RefusalCard
        credits={5}
        status="pending"
        onSearchWebAndAnswer={vi.fn()}
      />
    );

    expect(html).toContain('Searching the web via Tavily…');
  });
});
