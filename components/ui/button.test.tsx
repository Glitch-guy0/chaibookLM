import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './button';

describe('<Button /> component (AC-1.1.3, AC-1.1.4, AC-1.1.5)', () => {
  it('renders with 2px border and default data-testid', () => {
    const html = renderToStaticMarkup(<Button>Click me</Button>);
    expect(html).toContain('data-testid="button"');
    expect(html).toContain('border-2');
  });

  it('supports custom data-testid', () => {
    const html = renderToStaticMarkup(<Button data-testid="custom-action-btn">Action</Button>);
    expect(html).toContain('data-testid="custom-action-btn"');
  });

  it('includes elevation classes: 4px default shadow, 6px hover with -2px translate, 0px active with 4px translate', () => {
    const html = renderToStaticMarkup(<Button variant="primary">Elevated</Button>);
    expect(html).toContain('shadow-[4px_4px_0_0_');
    expect(html).toContain('hover:shadow-[6px_6px_0_0_');
    expect(html).toContain('hover:-translate-x-[2px]');
    expect(html).toContain('hover:-translate-y-[2px]');
    expect(html).toContain('active:shadow-none');
    expect(html).toContain('active:translate-x-[4px]');
    expect(html).toContain('active:translate-y-[4px]');
  });

  it('includes motion-reduce classes to disable translations and apply bottom border shift', () => {
    const html = renderToStaticMarkup(<Button>Accessible Motion</Button>);
    expect(html).toContain('motion-reduce:transform-none');
    expect(html).toContain('motion-reduce:hover:transform-none');
    expect(html).toContain('motion-reduce:active:transform-none');
    expect(html).toContain('motion-reduce:border-b-[5px]');
  });
});
