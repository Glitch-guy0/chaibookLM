'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChatMessage } from '../notebooks/api';

interface ChatPanelProps {
  notebookId: string;
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
          t.id === assistantId ? { ...t, content: '', status: 'streaming' } : t,
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
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {turn.content || (turn.status === 'streaming' ? '...' : '')}
                  </ReactMarkdown>
                </div>
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
