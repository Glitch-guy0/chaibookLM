'use client';

import { useEffect, useState } from 'react';

export function getTimeUntilMidnightIST(now: Date = new Date()): { hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const currentHour = parseInt(partMap.hour, 10);
  const currentMinute = parseInt(partMap.minute, 10);

  const minutesSinceMidnight = currentHour * 60 + currentMinute;
  const totalMinutesInDay = 24 * 60;

  let remainingMinutes = totalMinutesInDay - minutesSinceMidnight;
  if (remainingMinutes === totalMinutesInDay) {
    remainingMinutes = 0;
  }

  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  return { hours, minutes };
}

export interface ExpirationBannerProps {
  initialTime?: Date;
  className?: string;
}

export function ExpirationBanner({ initialTime, className = '' }: ExpirationBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number }>(() =>
    getTimeUntilMidnightIST(initialTime),
  );

  useEffect(() => {
    if (initialTime) return; // Static test mode
    const update = () => setTimeLeft(getTimeUntilMidnightIST());
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [initialTime]);

  return (
    <aside
      role="alert"
      data-testid="expiration-banner"
      data-debug="ExpirationBanner"
      className={`w-full border-b-2 border-border bg-[var(--accent,#FFE500)] px-4 py-2.5 text-center text-xs sm:text-sm font-mono font-bold text-ink dark:text-ink shadow-sm ${className}`}
    >
      ⏳ Auto-deletion Notice: This notebook will be auto-deleted tonight at 12:00 AM Asia/Kolkata (in{' '}
      {timeLeft.hours} hours, {timeLeft.minutes} minutes)
    </aside>
  );
}
