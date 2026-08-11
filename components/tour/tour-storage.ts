/**
 * First-run product tour flag primitive. Backed by `localStorage`, keyed by
 * Clerk user id -- deliberately NOT a cookie, since this is first-run UI
 * state, not a tracked preference gated by the story 5.3 consent banner.
 *
 * Every function is wrapped in try/catch: `localStorage` access can throw
 * (private-mode restrictions, disabled storage, SSR). On any failure this
 * fails safe by behaving as if the tour has already been seen -- i.e. it
 * never auto-starts on every load -- rather than crashing or nagging.
 */

function storageKey(userId: string): string {
  return `hasSeenTour:${userId}`;
}

export function hasSeenTour(userId: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }
    return window.localStorage.getItem(storageKey(userId)) === 'true';
  } catch (err) {
    console.error('tour-storage: hasSeenTour failed, failing safe', err);
    return true;
  }
}

export function markTourSeen(userId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(storageKey(userId), 'true');
  } catch (err) {
    console.error('tour-storage: markTourSeen failed', err);
  }
}

export function resetTour(userId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(storageKey(userId));
  } catch (err) {
    console.error('tour-storage: resetTour failed', err);
  }
}
