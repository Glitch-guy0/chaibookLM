/**
 * Minimal cookie get/set helpers, SSR-safe (no-op when `document` is
 * unavailable). Shared primitive for theme persistence (story 5.2) and,
 * later, the cookie-consent banner (story 5.3).
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(name.length + 1));
}

export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  const maxAge = days * 24 * 60 * 60;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax${secure}`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax${secure}`;
}
