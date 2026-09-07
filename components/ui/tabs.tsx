'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  /** Ordered list of tabs. */
  tabs: TabItem[];
  /** The currently active tab id. */
  activeTab?: string;
  /** Fired when the user selects a tab. */
  onTabChange?: (id: string) => void;
  /** aria-label for the tablist. */
  label: string;
  /** Called with the active tab id to render the panel content. */
  children: (activeTabId: string) => ReactNode;
}

/**
 * Real tablist primitive (WAI-ARIA tabs pattern):
 * - role="tablist" / role="tab" / role="tabpanel"
 * - aria-selected on the active tab
 * - arrow-key / Home / End navigation with roving tabindex
 * - accent yellow fill + bold weight for the active state
 */
export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  label,
  children,
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id);
  const active = activeTab ?? internalTab ?? tabs[0]?.id;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectTab = (id: string) => {
    setInternalTab(id);
    onTabChange?.(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const next = tabs[nextIndex];
    if (next) {
      selectTab(next.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="flex -space-x-1 overflow-x-auto border-b-2 border-border dark:border-border-dark"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                'whitespace-nowrap px-4 py-3 min-w-28 sm:min-w-40 text-xs font-mono uppercase tracking-wider',
                'border-2 border-border dark:border-border-dark rounded-t-sm',
                'focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2',
                isActive
                  ? 'bg-accent text-ink dark:text-ink font-bold border-b-transparent shadow-[3px_-3px_0_0_var(--border,#111111)]'
                  : 'bg-surface dark:bg-surface-dark text-muted hover:text-ink dark:hover:text-ink-dark font-medium',
              ].join(' ')}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={isActive ? 'text-[0.6em]' : 'text-[0.6em] text-transparent'}
                >
                  ▮
                </span>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="mt-6"
      >
        {children(active)}
      </div>
    </div>
  );
}
