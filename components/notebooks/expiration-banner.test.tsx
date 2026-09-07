import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExpirationBanner, getTimeUntilMidnightIST } from './expiration-banner';

describe('<ExpirationBanner /> (AC-1.5.1)', () => {
  it('correctly calculates remaining hours and minutes until midnight Asia/Kolkata', () => {
    // 2026-09-07T14:30:00Z = 20:00:00 IST (8:00 PM IST)
    const fixedTime = new Date('2026-09-07T14:30:00.000Z');
    const { hours, minutes } = getTimeUntilMidnightIST(fixedTime);
    expect(hours).toBe(4);
    expect(minutes).toBe(0);
  });

  it('renders persistent alert banner with required notice text and data-testid', () => {
    const fixedTime = new Date('2026-09-07T14:30:00.000Z');
    const html = renderToStaticMarkup(<ExpirationBanner initialTime={fixedTime} />);
    expect(html).toContain('data-testid="expiration-banner"');
    expect(html).toContain('⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (in 4 hours, 0 minutes)');
    expect(html).toContain('bg-[var(--accent,#FFE500)]');
  });
});
