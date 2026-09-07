import type { DriveStep } from 'driver.js';

/**
 * Ordered tour steps walking a first-run visitor through the product's
 * central trust loop (AC-1.6.1):
 * 1. Sources Pane (+ Add Source)
 * 2. Grounded Chat Composer
 * 3. Original View Showcase Pane
 * 4. Daily Credit Counter & Midnight Expiration Notice
 */
export const TOUR_STEPS: DriveStep[] = [
  {
    element: '#tab-sources',
    popover: {
      title: '1. Start with your sources',
      description: 'Add documents, PDFs, transcripts, or web links to research. Grounded answers draw strictly from here.',
    },
  },
  {
    element: '#tab-chat',
    popover: {
      title: '2. Grounded Chat Composer',
      description: 'Ask questions with strict source boundaries. Answers emit verifiable inline citation pills.',
    },
  },
  {
    element: '#tab-showcase',
    popover: {
      title: '3. Original View Showcase',
      description: 'Click any citation pill to verify proof with high-contrast cyan bounding boxes and page jumping.',
    },
  },
  {
    element: '[data-testid="expiration-banner"]',
    popover: {
      title: '4. Credits & Midnight Reset',
      description: 'You have 10 daily query credits. Active notebooks are ephemeral and auto-delete at midnight Asia/Kolkata.',
    },
  },
];
