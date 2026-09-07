'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  approveFetchOnRefusal,
  fetchChatHistory,
  fetchSources,
  streamChatMessage,
  type ChatMessageDTO,
  type CitationSnapshot,
} from '../notebooks/api';
import { CitationChip } from './citation-chip';

interface ChatPanelProps {
  notebookId: string;
  credits?: number;
  /** Opens a citation in the Showcase tab; `citationKey` is the clicked
   * chip's stable `data-citation-key` identifier, stored by `Workspace` as
   * `restoreFocusKey` for focus restore after Esc. */
  onOpenCitation?: (citation: CitationSnapshot, citationKey: string) => void;
  /** Set by `Workspace` right after switching back to `'chat'` (i.e. right
   * after this component remounts). Once set, an effect here re-queries
   * `[data-citation-key="..."]` and focuses it -- a raw DOM node captured
   * before the tab switch would already be detached, since `Tabs` fully
   * unmounts the inactive panel. */
  restoreFocusKey?: string | null;
  /** Reports back up once the re-query/focus attempt has run, so `Workspace`
   * can clear `restoreFocusKey`. */
  onFocusRestored?: () => void;
}

const MARKER_RE = /\[\[([^[\]]+)\]\]/g;

/**
 * Settle-time transform (never applied mid-stream, per spec Design Notes):
 * replaces each `[[chunkId]]` occurrence that is present in `validChunkIds`
 * with a `[•](citation:chunkId:occurrenceIndex)` markdown-link placeholder
 * consumed by the `a` component override below; any other `[[chunkId]]`-
 * shaped text (unknown/unvalidated marker) is stripped to nothing (AD-7 --
 * dropped markers are invisible, never shown as raw bracket text). The
 * occurrence index is computed here, once per transform pass, and encoded
 * into the href itself rather than via a render-time counter closure -- this
 * keeps the `a` renderer a pure function of its href, so `components` (built
 * from it) can be `useMemo`'d instead of rebuilt every render.
 */
function transformMarkersToChipLinks(content: string, validChunkIds: Set<string>): string {
  const occurrenceCounts = new Map<string, number>();
  return content.replace(MARKER_RE, (full, chunkId: string) => {
    if (!validChunkIds.has(chunkId)) return '';
    const occurrenceIndex = occurrenceCounts.get(chunkId) ?? 0;
    occurrenceCounts.set(chunkId, occurrenceIndex + 1);
    return `[•](citation:${encodeURIComponent(chunkId)}:${occurrenceIndex})`;
  });
}

type TurnStatus = 'streaming' | 'done' | 'failed';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: TurnStatus;
  /** The original user message that produced this turn -- stored per-turn
   * (fold-in fix) so retrying an older failed turn resends the right text
   * even if newer turns were sent since. */
  sourceMessage: string;
  /** The persisted user chat_messages row id for this turn, once known --
   * threaded back in as `retryOfMessageId` on retry so a retry reuses the
   * already-persisted user message instead of inserting a duplicate. */
  userMessageId?: string;
  /** Validated CitationSnapshot[] from the CHAT_CITATIONS: trailer, present
   * only once a successful (non-refusal, non-failed) assistant turn has
   * settled -- undefined while streaming, on failure, and on refusals. */
  citations?: CitationSnapshot[];
  /** True only when the CHAT_REFUSAL: trailer was seen for this turn -- the
   * explicit, never-string-matched structural refusal signal. When set, this
   * turn renders "Not in your sources." plus the fetch-on-refusal affordance
   * instead of markdown content. */
  refusal?: boolean;
  /** Local-only state machine for the "Find related web pages" approval
   * action on a refusal turn. Absent/`'idle'` renders the button; `'pending'`
   * disables the composer (same gate as an in-flight chat turn); `'done'`
   * shows "Added N sources"; `'failed'` restores the refusal affordance with
   * a message (and, except for the capped case, a retryable button). */
  fetchOnRefusal?: {
    status: 'idle' | 'pending' | 'done' | 'failed';
    added?: number;
    reason?: string;
  };
}

let turnCounter = 0;
function nextId(): string {
  turnCounter += 1;
  return `turn-${turnCounter}-${Date.now()}`;
}

/** Distance (px) from the top of the message list at which a scroll event
 * triggers loading the next-older history page. */
const SCROLL_LOAD_THRESHOLD_PX = 40;

/**
 * Maps one persisted `chat_messages` row into the same `Turn` shape the live
 * streaming path produces (design decision, Story 4.5): each row becomes its
 * own `Turn` one-to-one (no pairing into user+assistant "exchanges") since
 * `Turn` already models one row per entry and pairing would need to
 * reconstruct exchange boundaries the server doesn't guarantee either
 * (refusal/error rows still count as their own row). Historical turns always
 * settle as `status: 'done'` -- there is no live stream to be "in progress"
 * for a reloaded row -- and never carry `refusal`/`fetchOnRefusal` (per the
 * Never rule: a reloaded refusal turn shows its stored content/citations but
 * never re-offers a stale "Find related web pages" action).
 */
function dtoToTurn(message: ChatMessageDTO): Turn {
  const role = message.role === 'assistant' ? 'assistant' : 'user';
  return {
    id: `hist-${message.id}`,
    role,
    content: message.content,
    status: 'done',
    sourceMessage: message.content,
    userMessageId: role === 'user' ? message.id : undefined,
    citations: role === 'assistant' ? message.citations : undefined,
  };
}

/**
 * Chat panel: message list (markdown, aria-live region) + composer
 * (auto-grow textarea, Enter sends / Shift+Enter newline, disabled while
 * streaming) + inline retry on failed messages.
 */
export function ChatPanel({
  notebookId,
  credits = 10,
  onOpenCitation,
  restoreFocusKey,
  onFocusRestored,
}: ChatPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [announcement, setAnnouncement] = useState('');
  // Single in-flight-turn gate shared by send() and retry() (fold-in fix) --
  // mutation.isPending alone only reflected send()'s state, letting retry()
  // start a second overlapping turn while one was already streaming.
  const [isTurnActive, setIsTurnActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // ── Chat history pagination (Story 4.5) ─────────────────────────────────
  // `hasMoreHistory` starts true so the initial load-on-mount fetch always
  // runs; it flips to whatever the first response reports. `oldestLoadedId`
  // is the cursor for the *next* older-page fetch -- undefined only before
  // any page has loaded (empty history).
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [oldestLoadedId, setOldestLoadedId] = useState<string | undefined>(undefined);
  const [isLoadingOlderHistory, setIsLoadingOlderHistory] = useState(false);
  const [historyError, setHistoryError] = useState<'initial' | 'older' | null>(null);
  // Ref mirror of the in-flight guard (fold-in-style) -- state alone can lag
  // a rapid second scroll-to-top event fired before the re-render that would
  // reflect `isLoadingOlderHistory: true` has committed.
  const isFetchingOlderRef = useRef(false);
  const initialHistoryLoadedRef = useRef(false);
  // Tracks the last turn's id so the bottom-scroll effect only fires on an
  // *append* (a new live turn added at the end) and never on a *prepend*
  // (an older-history page loaded at the top, which must not move the view).
  const lastTurnIdRef = useRef<string | null>(null);

  const loadInitialHistory = useCallback(() => {
    setHistoryError(null);
    fetchChatHistory(notebookId)
      .then((res) => {
        const rows = res.messages.filter((m) => m.role !== 'system');
        // Prepend rather than replace: if the user already sent a message
        // before this initial load resolved, a wholesale replace would wipe
        // that in-flight/optimistic turn out of view.
        setTurns((prev) => [...rows.map(dtoToTurn), ...prev]);
        setHasMoreHistory(res.hasMore);
        setOldestLoadedId(res.messages[0]?.id);
      })
      .catch(() => {
        setHasMoreHistory(false);
        setHistoryError('initial');
      });
  }, [notebookId]);

  // Load-on-mount: replaces the empty initial `turns` state with the most
  // recent page. Guarded by a ref (not just the effect's dependency array)
  // so React StrictMode's double-invoke in development never fires two
  // overlapping fetches.
  useEffect(() => {
    if (initialHistoryLoadedRef.current) return;
    initialHistoryLoadedRef.current = true;
    loadInitialHistory();
  }, [loadInitialHistory]);

  const loadOlderHistory = useCallback(() => {
    if (isFetchingOlderRef.current || !hasMoreHistory || !oldestLoadedId) return;
    const container = listContainerRef.current;
    isFetchingOlderRef.current = true;
    setIsLoadingOlderHistory(true);
    setHistoryError(null);
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;
    fetchChatHistory(notebookId, oldestLoadedId)
      .then((res) => {
        const rows = res.messages.filter((m) => m.role !== 'system');
        if (rows.length > 0) {
          setTurns((prev) => [...rows.map(dtoToTurn), ...prev]);
        }
        // Advance the cursor from the raw (unfiltered) oldest fetched
        // message, not the filtered `rows` -- a page consisting entirely of
        // system-role rows would otherwise never advance the cursor, making
        // every subsequent scroll-to-top re-fetch the exact same page.
        if (res.messages.length > 0) {
          setOldestLoadedId(res.messages[0].id);
        }
        setHasMoreHistory(res.hasMore);
        // Restore scroll offset after the prepended content mounts so there
        // is no visible jump -- runs on the next frame, once the DOM has
        // reflowed with the new (taller) content above the fold.
        requestAnimationFrame(() => {
          if (!container) return;
          const delta = container.scrollHeight - prevScrollHeight;
          container.scrollTop = prevScrollTop + delta;
        });
      })
      .catch(() => {
        setHistoryError('older');
      })
      .finally(() => {
        isFetchingOlderRef.current = false;
        setIsLoadingOlderHistory(false);
      });
  }, [notebookId, hasMoreHistory, oldestLoadedId]);

  const handleListScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (e.currentTarget.scrollTop > SCROLL_LOAD_THRESHOLD_PX) return;
      loadOlderHistory();
    },
    [loadOlderHistory],
  );
  // Distinct AbortController per in-flight call (fold-in fix) -- a single
  // shared ref let a second call's controller silently replace the first,
  // aborting the wrong request when either one finished or was cancelled.
  const activeControllersRef = useRef<Set<AbortController>>(new Set());

  // Source-title lookup for citation chips: deduped by TanStack Query
  // against any existing Sources-tab fetch for this notebookId -- no new
  // network call per chip.
  const sourcesQuery = useQuery({
    queryKey: ['sources', notebookId],
    queryFn: () => fetchSources(notebookId),
  });
  const sourceTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const source of sourcesQuery.data?.sources ?? []) {
      map.set(source.id, source.title);
    }
    return map;
  }, [sourcesQuery.data]);

  useEffect(() => {
    const last = turns[turns.length - 1];
    const lastId = last ? last.id : null;
    // Only auto-scroll to bottom when the *last* turn changed (a new turn
    // appended, e.g. a send or the initial history load) -- a prepend from
    // `loadOlderHistory` leaves the last turn's id unchanged, so it never
    // fights the manual scroll-offset restore above.
    if (lastId !== lastTurnIdRef.current) {
      listEndRef.current?.scrollIntoView({ block: 'end' });
    }
    lastTurnIdRef.current = lastId;
  }, [turns]);

  // Focus restore after returning from the Showcase tab: `restoreFocusKey`
  // is set right after this component remounts (Tabs fully unmounts the
  // inactive panel), so re-query the chip by its stable data-citation-key
  // instead of relying on any DOM node captured before the tab switch (that
  // node would already be detached). Silently no-ops if the exact chip no
  // longer exists (e.g. the turn was cleared).
  useEffect(() => {
    if (!restoreFocusKey) return;
    const el = document.querySelector<HTMLElement>(
      `[data-citation-key="${CSS.escape(restoreFocusKey)}"]`,
    );
    el?.focus();
    onFocusRestored?.();
  }, [restoreFocusKey, onFocusRestored]);

  // Unmount cleanup (fold-in fix): abort any turn still in flight so it
  // doesn't keep streaming/updating state after the component is gone.
  useEffect(() => {
    return () => {
      for (const controller of activeControllersRef.current) {
        controller.abort();
      }
      activeControllersRef.current.clear();
    };
  }, []);

  const runTurn = useCallback(
    async (
      sourceMessage: string,
      assistantId: string,
      userTurnId: string | null,
      retryOfMessageId?: string,
    ) => {
      setIsTurnActive(true);
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? { ...t, content: '', status: 'streaming', citations: undefined }
            : t,
        ),
      );

      const controller = new AbortController();
      activeControllersRef.current.add(controller);

      try {
        const result = await streamChatMessage(
          notebookId,
          sourceMessage,
          (token) => {
            setTurns((prev) =>
              prev.map((t) =>
                t.id === assistantId ? { ...t, content: t.content + token } : t,
              ),
            );
          },
          controller.signal,
          retryOfMessageId,
        );

        setTurns((prev) =>
          prev.map((t) => {
            const isAssistant = t.id === assistantId;
            const isUser = userTurnId !== null && t.id === userTurnId;
            if (!isAssistant && !isUser) return t;
            const withUserMessageId = result.userMessageId
              ? { userMessageId: result.userMessageId }
              : {};
            if (isAssistant) {
              return {
                ...t,
                ...withUserMessageId,
                status: result.failed ? 'failed' : 'done',
                content: result.failed ? t.content : result.fullText,
                citations: result.failed ? undefined : result.citations,
                refusal: result.failed ? undefined : result.refusal,
                fetchOnRefusal:
                  !result.failed && result.refusal ? { status: 'idle' } : undefined,
              };
            }
            return { ...t, ...withUserMessageId };
          }),
        );

        // aria-live: announce only the settled final message (success or
        // failure) -- never intermediate tokens, to avoid screen-reader spam.
        if (result.failed) {
          setAnnouncement(
            `Answer failed: ${result.errorMessage ?? 'something went wrong.'}`,
          );
        } else {
          setAnnouncement(result.fullText);
        }
      } finally {
        activeControllersRef.current.delete(controller);
        setIsTurnActive(false);
      }
    },
    [notebookId],
  );

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const userTurnId = nextId();
      const assistantId = nextId();
      setTurns((prev) => [
        ...prev,
        { id: userTurnId, role: 'user', content: text, status: 'done', sourceMessage: text },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          status: 'streaming',
          sourceMessage: text,
        },
      ]);
      await runTurn(text, assistantId, userTurnId);
    },
  });

  // Any turn's pending fetch-on-refusal gates the composer the same way an
  // in-flight chat turn does, per AD-13/Boundaries -- a second question can't
  // be sent mid-fetch.
  const isFetchOnRefusalPending = turns.some(
    (t) => t.fetchOnRefusal?.status === 'pending',
  );
  const isStreaming = isTurnActive || isFetchOnRefusalPending;

  const approveFetch = useCallback(
    (turn: Turn) => {
      if (turn.fetchOnRefusal?.status === 'pending') return;
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turn.id ? { ...t, fetchOnRefusal: { status: 'pending' } } : t,
        ),
      );
      void approveFetchOnRefusal(notebookId, turn.sourceMessage)
        .then((result) => {
          setTurns((prev) =>
            prev.map((t) => {
              if (t.id !== turn.id) return t;
              if (result.ok) {
                return { ...t, fetchOnRefusal: { status: 'done', added: result.added } };
              }
              return { ...t, fetchOnRefusal: { status: 'failed', reason: result.reason } };
            }),
          );
        })
        .catch((err: unknown) => {
          const reason = err instanceof Error ? err.message : 'search_failed';
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turn.id ? { ...t, fetchOnRefusal: { status: 'failed', reason } } : t,
            ),
          );
        });
    },
    [notebookId],
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    mutation.mutate(text);
  }, [input, isStreaming, mutation]);

  const retry = useCallback(
    (turn: Turn) => {
      if (isStreaming) return;
      void runTurn(turn.sourceMessage, turn.id, null, turn.userMessageId);
    },
    [isStreaming, runTurn],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const latestTurn = turns[turns.length - 1];

  return (
    <div data-debug="ChatPanel" className="flex flex-col gap-4">
      <div
        ref={listContainerRef}
        onScroll={handleListScroll}
        data-debug="ChatMessageList"
        className="flex min-h-[16rem] flex-col gap-4 overflow-y-auto rounded-default border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark p-4"
      >
        {isLoadingOlderHistory && (
          <p
            data-debug="ChatHistoryLoadingIndicator"
            className="text-center text-xs text-ink-muted dark:text-ink-muted-dark"
          >
            Loading older messages…
          </p>
        )}
        {historyError && (
          <div
            data-debug="ChatHistoryError"
            className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400"
          >
            <p>
              {historyError === 'initial'
                ? 'Could not load chat history.'
                : 'Could not load older messages.'}
            </p>
            <button
              type="button"
              data-debug="ChatHistoryRetryButton"
              onClick={() => (historyError === 'initial' ? loadInitialHistory() : loadOlderHistory())}
              className="font-semibold underline underline-offset-2 hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              Retry
            </button>
          </div>
        )}
        {turns.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            Ask a question about your sources to get started.
          </p>
        ) : (
          turns.map((turn) => (
            <div
              key={turn.id}
              data-debug={`ChatTurn-${turn.role}`}
              className={
                turn.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-default bg-ink text-white dark:bg-ink-dark px-4 py-2'
                  : 'max-w-[85%] rounded-default border-2 border-border dark:border-border-dark bg-white dark:bg-surface-dark px-4 py-2'
              }
            >
              {turn.role === 'assistant' ? (
                <AssistantMessageContent
                  turn={turn}
                  sourceTitleById={sourceTitleById}
                  onOpenCitation={onOpenCitation}
                />
              ) : (
                <p className="whitespace-pre-wrap">{turn.content}</p>
              )}
              {turn.status === 'failed' && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Something went wrong.
                  </p>
                  <button
                    type="button"
                    data-debug="ChatRetryButton"
                    onClick={() => retry(turn)}
                    disabled={isStreaming}
                    className="text-sm font-semibold underline underline-offset-2 text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              )}
              {turn.refusal && turn.status === 'done' && (
                <div className="mt-2" data-debug="ChatFetchOnRefusal">
                  {(!turn.fetchOnRefusal || turn.fetchOnRefusal.status === 'idle') && (
                    <button
                      type="button"
                      data-debug="ChatFindWebPagesButton"
                      onClick={() => approveFetch(turn)}
                      disabled={isStreaming}
                      className="text-sm font-semibold underline underline-offset-2 text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                    >
                      Find related web pages
                    </button>
                  )}
                  {turn.fetchOnRefusal?.status === 'pending' && (
                    <p
                      className="text-sm text-ink-muted dark:text-ink-muted-dark"
                      data-debug="ChatFetchOnRefusalPending"
                    >
                      Searching the web…
                    </p>
                  )}
                  {turn.fetchOnRefusal?.status === 'done' && (
                    <p
                      className="text-sm text-ink-secondary dark:text-ink-secondary-dark"
                      data-debug="ChatFetchOnRefusalDone"
                    >
                      Added {turn.fetchOnRefusal.added} source
                      {turn.fetchOnRefusal.added === 1 ? '' : 's'}.
                    </p>
                  )}
                  {turn.fetchOnRefusal?.status === 'failed' && (
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm text-red-600 dark:text-red-400"
                        data-debug="ChatFetchOnRefusalError"
                      >
                        {turn.fetchOnRefusal.reason === 'capped'
                          ? 'Source limit reached.'
                          : turn.fetchOnRefusal.reason === 'no_results'
                            ? 'No related pages found.'
                            : 'Something went wrong.'}
                      </p>
                      {turn.fetchOnRefusal.reason !== 'capped' && (
                        <button
                          type="button"
                          data-debug="ChatFetchOnRefusalRetryButton"
                          onClick={() => approveFetch(turn)}
                          disabled={isStreaming}
                          className="text-sm font-semibold underline underline-offset-2 text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={listEndRef} />
      </div>

      {/* Stable aria-live region: announces only the final settled message
          (success or failure), never intermediate streaming tokens. */}
      <div aria-live="polite" className="sr-only" data-debug="ChatAriaLive">
        {announcement}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          data-debug="ChatComposer"
          data-testid="chat-composer-textarea"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isStreaming || credits <= 0}
          placeholder={
            credits <= 0
              ? '0 credits remaining. Composer disabled until midnight reset.'
              : 'Ask a question about your sources...'
          }
          rows={1}
          className="min-h-[2.75rem] flex-1 resize-none rounded-default border-2 border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        />
        <button
          type="button"
          data-debug="ChatSendButton"
          data-testid="chat-send-button"
          onClick={send}
          disabled={isStreaming || !input.trim() || credits <= 0}
          className="rounded-default bg-ink dark:bg-ink-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          {isStreaming ? 'Sending…' : 'Send'}
        </button>
      </div>
      {latestTurn?.status === 'streaming' && (
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
          Generating answer…
        </p>
      )}
    </div>
  );
}

/**
 * Renders one assistant turn's content. While the turn is still streaming,
 * raw markdown is rendered unchanged (no marker substitution mid-stream, per
 * spec Design Notes). Once settled (done or failed), validated `[[chunkId]]`
 * markers become `CitationChip`s and unvalidated/dropped ones are stripped
 * to plain text -- a settle-time transform, computed once per render via the
 * turn's own `citations` (present only on a successful non-refusal turn).
 */
function AssistantMessageContent({
  turn,
  sourceTitleById,
  onOpenCitation,
}: {
  turn: Turn;
  sourceTitleById: Map<string, string>;
  onOpenCitation?: (citation: CitationSnapshot, citationKey: string) => void;
}) {
  // Only a successfully completed turn has validated citations to transform.
  // A failed turn's partial content is rendered raw, same as while streaming,
  // rather than having any complete-looking [[chunkId]] markers stripped.
  const isDone = turn.status === 'done';

  const { markdown, chunkIdToCitation } = useMemo(() => {
    if (!isDone) {
      return { markdown: turn.content, chunkIdToCitation: new Map<string, CitationSnapshot>() };
    }
    const citations = turn.citations ?? [];
    const validChunkIds = new Set(citations.map((c) => c.chunkId));
    const byChunkId = new Map<string, CitationSnapshot>();
    for (const citation of citations) byChunkId.set(citation.chunkId, citation);
    return {
      markdown: transformMarkersToChipLinks(turn.content, validChunkIds),
      chunkIdToCitation: byChunkId,
    };
  }, [isDone, turn.content, turn.citations]);

  // Pure function of `chunkIdToCitation`/`sourceTitleById`/`onOpenCitation` --
  // the occurrence index is already baked into `href` by the transform above,
  // so this needs no per-render mutable counter and can be safely memoized
  // (avoids rebuilding react-markdown's renderer map, and remounting every
  // chip, on every unrelated re-render of this component).
  const components: Components = useMemo(
    () => ({
      a: ({ href, children, ...props }) => {
        if (typeof href === 'string' && href.startsWith('citation:')) {
          const [, encodedChunkId, occurrenceIndex] = href.split(':');
          const chunkId = decodeURIComponent(encodedChunkId ?? '');
          const citation = chunkIdToCitation.get(chunkId);
          if (!citation) return null;
          const citationKey = `${turn.id}-${chunkId}-${occurrenceIndex}`;
          return (
            <CitationChip
              citation={citation}
              sourceTitle={sourceTitleById.get(citation.sourceId)}
              citationKey={citationKey}
              onOpenCitation={(c, key) => onOpenCitation?.(c, key)}
            />
          );
        }
        return (
          <a href={href} {...props}>
            {children}
          </a>
        );
      },
    }),
    [chunkIdToCitation, sourceTitleById, onOpenCitation, turn.id],
  );

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown || (turn.status === 'streaming' ? '...' : '')}
      </ReactMarkdown>
    </div>
  );
}
