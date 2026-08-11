'use client';

import { useCallback, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@components/landing/use-scroll-reveal';
import { hasSeenTour, markTourSeen, resetTour } from './tour-storage';
import { TOUR_STEPS } from './tour-config';
import type { Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_TARGET_IDS = ['tab-sources', 'tab-chat', 'tab-showcase'];

function allTargetsPresent(): boolean {
  if (typeof document === 'undefined') return false;
  return TOUR_TARGET_IDS.every((id) => document.getElementById(id) !== null);
}

/**
 * Orchestrates the first-run driver.js walkthrough for a notebook workspace.
 *
 * - Auto-starts once, on mount, when `userId` has never seen the tour and
 *   all three tab targets already exist in the DOM.
 * - Any exit path (close button, Escape, overlay click, natural completion)
 *   marks the tour seen so it never auto-starts again for this user.
 * - Honors `prefers-reduced-motion` by disabling driver.js's built-in
 *   animation.
 * - Exposes `replay()` for the Account page's "Replay product tour" control.
 */
export function useProductTour(
  userId: string | null | undefined,
  options: { ready?: boolean; autoReplay?: boolean } = {},
) {
  const { ready = true, autoReplay = false } = options;
  const driverRef = useRef<Driver | null>(null);
  const autoReplayedRef = useRef(false);

  const buildAndDrive = useCallback(async (uid: string, abortRef: { current: boolean }) => {
    const { driver } = await import('driver.js');
    if (abortRef.current) return;

    const markSeen = () => markTourSeen(uid);

    const instance = driver({
      animate: !prefersReducedMotion(),
      popoverClass: 'chai-tour-popover',
      allowClose: true,
      overlayClickBehavior: 'close',
      steps: TOUR_STEPS,
      onPopoverRender: (popover) => {
        popover.wrapper.setAttribute('role', 'dialog');
        popover.wrapper.setAttribute('aria-modal', 'true');
      },
      onDestroyed: () => {
        markSeen();
      },
      onCloseClick: (_element, _step, opts) => {
        markSeen();
        opts.driver.destroy();
      },
    });

    driverRef.current = instance;
    instance.drive();
  }, []);

  useEffect(() => {
    if (!userId || !ready) return;
    const abortRef = { current: false };

    // Explicit replay request (e.g. from the Account page) takes priority
    // over the first-run check, and only fires once per mount. `startedRef`
    // (not just `autoReplayedRef`) gates the fallthrough below so a second
    // effect invocation (e.g. React Strict Mode's mount-cleanup-mount) can't
    // fall through to the first-run branch and start a second drive.
    if (autoReplay && !autoReplayedRef.current && allTargetsPresent()) {
      autoReplayedRef.current = true;
      resetTour(userId);
      void buildAndDrive(userId, abortRef);
      return () => {
        abortRef.current = true;
        driverRef.current?.destroy();
        driverRef.current = null;
      };
    }
    if (autoReplayedRef.current) return;

    if (hasSeenTour(userId)) return;
    if (!allTargetsPresent()) return;

    void buildAndDrive(userId, abortRef);

    return () => {
      abortRef.current = true;
      driverRef.current?.destroy();
      driverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ready, autoReplay]);

  const replay = useCallback((): { ok: boolean } => {
    if (!userId) return { ok: false };
    if (!allTargetsPresent()) return { ok: false };

    resetTour(userId);
    void buildAndDrive(userId, { current: false });
    return { ok: true };
  }, [userId, buildAndDrive]);

  return { replay };
}
