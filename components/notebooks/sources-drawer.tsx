'use client';

import { useEffect } from 'react';
import { SourcesPanel } from '@components/sources/sources-panel';

interface SourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
  sourceCount?: number;
}

/**
 * Slide-over Neo-Brutalist Drawer for Tablet Viewport (Story 4.5: AC-4.5.1)
 * Slides in from the left over the 50/50 split workspace, rendering the
 * complete SourcesPanel with a backdrop and keyboard accessibility (Esc closes).
 */
export function SourcesDrawer({
  isOpen,
  onClose,
  notebookId,
  sourceCount = 0,
}: SourcesDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sources Drawer"
      data-debug="SourcesDrawer"
      data-testid="sources-drawer"
      className="fixed inset-0 z-50 flex"
    >
      {/* Semi-transparent backdrop */}
      <div
        data-debug="DrawerBackdrop"
        data-testid="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div
        data-debug="DrawerPanel"
        data-testid="drawer-panel"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-r-3 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 shadow-[8px_0_0_0_#111111] overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b-2 border-border dark:border-border-dark pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-wider text-ink dark:text-ink-dark uppercase">
              Sources ({sourceCount}/10)
            </span>
          </div>
          <button
            type="button"
            data-debug="DrawerCloseButton"
            data-testid="drawer-close-button"
            onClick={onClose}
            aria-label="Close sources drawer"
            className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border dark:border-border-dark bg-[#FFE500] font-mono text-base font-bold text-ink shadow-[2px_2px_0_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Sources Content */}
        <div className="flex-1">
          <SourcesPanel notebookId={notebookId} />
        </div>
      </div>
    </div>
  );
}
