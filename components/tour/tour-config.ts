import type { DriveStep } from 'driver.js';

/**
 * Ordered tour steps walking a first-run visitor through the product's
 * central trust loop: add a source, ask a grounded question, then see the
 * citation trace back to the original passage.
 */
export const TOUR_STEPS: DriveStep[] = [
  {
    element: '#tab-sources',
    popover: {
      title: 'Start with your sources',
      description: 'Add the documents or pages you want to research — everything the assistant answers from lives here.',
    },
  },
  {
    element: '#tab-chat',
    popover: {
      title: 'Ask grounded questions',
      description: 'Chat answers are generated only from your sources, so every claim can be traced back to something you added.',
    },
  },
  {
    element: '#tab-showcase',
    popover: {
      title: 'Verify with citations',
      description: 'Tap a citation in an answer to jump here and see the exact original passage it came from.',
    },
  },
];
