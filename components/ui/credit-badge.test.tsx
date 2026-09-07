import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CreditBadge } from './credit-badge';

describe('<CreditBadge /> component (AC-1.4.1, AC-1.4.2, AC-1.4.3, AC-1.4.4)', () => {
  it('renders normal state with ⚡ icon and credits ratio when balance > 2 (AC-1.4.1)', () => {
    const html = renderToStaticMarkup(<CreditBadge credits={10} maxCredits={10} />);
    expect(html).toContain('data-testid="credit-badge"');
    expect(html).toContain('⚡');
    expect(html).toContain('10/10 credits');
    expect(html).toContain('bg-surface');
  });

  it('renders warning yellow state when credits <= 2 (AC-1.4.2)', () => {
    const html = renderToStaticMarkup(<CreditBadge credits={2} maxCredits={10} />);
    expect(html).toContain('2/10 credits');
    expect(html).toContain('bg-[var(--accent,#FFE500)]');
  });

  it('renders locked red state with 🔒 icon when credits reach 0 (AC-1.4.3)', () => {
    const html = renderToStaticMarkup(<CreditBadge credits={0} maxCredits={10} />);
    expect(html).toContain('🔒');
    expect(html).toContain('0/10 credits');
    expect(html).toContain('bg-[var(--danger,#FF3333)]');
  });
});
