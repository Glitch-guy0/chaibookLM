'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchSources, streamChatMessage, type CitationSnapshot } from '../notebooks/api';
import { CitationChip } from './citation-chip';

interface ChatPanelProps {
  notebookId: string;
}

const MARKER_RE = /\[\[([^[\]]+)\]\]/g;

/**
 * Settle-time transform (never applied mid-stream, per spec Design Notes):
 * replaces each `[[chunkId]]` occurrence that is present in `validChunkIds`
 * with a `[•](citation:chunkId)` markdown-link placeholder consumed by the
 * `a` component override below; any other `[[chunkId]]`-shaped text (unknown
 * / unvalidated marker) is stripped to nothing (AD-7 -- dropped markers are
 * invisible, never shown as raw bracket text).
 */
function transformMarkersToChipLinks(content: string, validChunkIds: Set<string>): string {
  return content.replace(MARKER_RE, (full, chunkId: string) => {
    return validChunkIds.has(chunkId) ? `[•](citation:${encodeURIComponent(chunkId)})` : '';
  });
}

/** No-op placeholder -- opening the cited source (Original View) is Story
 * 4.3's scope. This story only exposes the interaction point. */
function handleOpenCitationPlaceholder(_citation: CitationSnapshot) {
  // Intentionally empty.
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
}

let turnCounter = 0;
function nextId(): string {
  turnCounter += 1;
  return `turn-${turnCounter}-${Date.now()}`;
}

/**
 * Chat panel: message list (markdown, aria-live region) + composer
 * (auto-grow textarea, Enter sends / Shift+Enter newline, disabled while
 * streaming) + inline retry on failed messages.
 */
export function ChatPanel({ notebookId }: ChatPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [announcement, setAnnouncement] = useState('');
  // Single in-flight-turn gate shared by send() and retry() (fold-in fix) --
  // mutation.isPending alone only reflected send()'s state, letting retry()
  // start a second overlapping turn while one was already streaming.
  const [isTurnActive, setIsTurnActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
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
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [turns]);

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

  const isStreaming = isTurnActive;

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
        data-debug="ChatMessageList"
        className="flex min-h-[16rem] flex-col gap-4 overflow-y-auto rounded-default border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark p-4"
      >
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
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Ask a question about your sources..."
          rows={1}
          className="min-h-[2.75rem] flex-1 resize-none rounded-default border-2 border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        />
        <button
          type="button"
          data-debug="ChatSendButton"
          onClick={send}
          disabled={isStreaming || !input.trim()}
          className="rounded-default bg-ink dark:bg-ink-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
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
}: {
  turn: Turn;
  sourceTitleById: Map<string, string>;
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

  const components: Components = useMemo(
    () => ({
      a: ({ href, children, ...props }) => {
        if (typeof href === 'string' && href.startsWith('citation:')) {
          const chunkId = decodeURIComponent(href.slice('citation:'.length));
          const citation = chunkIdToCitation.get(chunkId);
          if (!citation) return null;
          return (
            <CitationChip
              citation={citation}
              sourceTitle={sourceTitleById.get(citation.sourceId)}
              onOpenCitation={handleOpenCitationPlaceholder}
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
    [chunkIdToCitation, sourceTitleById],
  );

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown || (turn.status === 'streaming' ? '...' : '')}
      </ReactMarkdown>
    </div>
  );
}
