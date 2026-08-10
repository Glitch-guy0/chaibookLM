import { describe, expect, it, vi } from 'vitest';
import {
  ChatService,
  FAILED_CONTENT_MARKER,
  isFailedContent,
  stripFailedMarker,
  HISTORY_WINDOW,
  type ChatRepo,
  type ChatMemory,
  type ChatReasoning,
  type ChatLlm,
} from '../index';
import { NOT_IN_SOURCES_ANSWER } from '../../../templates/GroundedAnswerReasoningStrategy';
import type { ChatMessage } from '../../../shared-kernel/types';
import type { ScoredChunk } from '../../../ports/VectorStore';

function makeChunk(overrides: Partial<ScoredChunk> = {}): ScoredChunk {
  return {
    chunkId: 'chunk-1',
    sourceId: 'source-1',
    notebookId: 'notebook-a',
    span: { start: 0, end: 10 },
    position: 0,
    text: 'sample chunk text',
    score: 0.9,
    ...overrides,
  };
}

function makeFakeRepo(overrides: Partial<ChatRepo> = {}): ChatRepo & {
  created: Array<{ notebookId: string; userId: string; role: string; content: string }>;
} {
  const created: Array<{ notebookId: string; userId: string; role: string; content: string }> = [];
  return {
    created,
    createChatMessage: vi.fn(async (notebookId, userId, role, content) => {
      created.push({ notebookId, userId, role, content });
      return { id: `msg-${created.length}` };
    }),
    findRecentChatMessages: vi.fn(async () => []),
    ...overrides,
  };
}

const fakeReasoning: ChatReasoning = {
  buildSystemPrompt: () => 'SYSTEM',
  buildUserPrompt: () => 'USER_PROMPT',
};

async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of gen) out.push(item);
  return out;
}

describe('ChatService.ask', () => {
  it('CROSS_NOTEBOOK_ISOLATION: retrieval is scoped to the memory strategy passed in for this notebook only', async () => {
    const repo = makeFakeRepo();
    const seenQueries: string[] = [];
    // Simulates a memory strategy that is itself scoped to notebook "a" --
    // it must never be asked about, or return, notebook "b"'s chunks.
    const memory: ChatMemory = {
      retrieveChunks: async (query) => {
        seenQueries.push(query);
        return [makeChunk({ notebookId: 'notebook-a' })];
      },
    };
    const llm: ChatLlm = {
      streamComplete: async () => makeTokenStream(['Answer ', 'from notebook A.']),
    };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-a', 'What is in here?'));

    expect(seenQueries).toEqual(['What is in here?']);
    const done = events.find((e) => e.type === 'done');
    expect(done?.fullText).toBe('Answer from notebook A.');
    // No chunk from any other notebook ever appears in what the assistant
    // message ultimately persists.
    const assistantRow = repo.created.find((c) => c.role === 'assistant');
    expect(assistantRow?.content).not.toContain('notebook-b');
  });

  it('NO_MATCH / EMPTY_NOTEBOOK: empty retrieval short-circuits to a structural refusal without calling the LLM', async () => {
    const repo = makeFakeRepo();
    const memory: ChatMemory = { retrieveChunks: async () => [] };
    const llm: ChatLlm = { streamComplete: vi.fn() };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-empty', 'Anything in here?'));

    expect(llm.streamComplete).not.toHaveBeenCalled();
    const done = events.find((e) => e.type === 'done');
    expect(done?.fullText).toBe(NOT_IN_SOURCES_ANSWER);
    expect(events.some((e) => e.type === 'token' && e.token === NOT_IN_SOURCES_ANSWER)).toBe(true);

    const assistantRow = repo.created.find((c) => c.role === 'assistant');
    expect(assistantRow?.content).toBe(NOT_IN_SOURCES_ANSWER);
    // No citations possible on a refusal.
    expect(assistantRow?.content).not.toMatch(/\[\[.*\]\]/);
  });

  it('SLIDING_WINDOW: requests exactly HISTORY_WINDOW most-recent turns regardless of total history size', async () => {
    const repo = makeFakeRepo({
      findRecentChatMessages: vi.fn(async (_notebookId: string, limit: number) => {
        expect(limit).toBe(HISTORY_WINDOW);
        const all: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
          id: `m${i}`,
          notebookId: 'notebook-a',
          userId: 'user-1',
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `turn ${i}`,
          createdAt: new Date(),
        }));
        // A real findRecentChatMessages already returns only the most recent
        // `limit` turns, chronologically ordered -- simulate that contract.
        return all.slice(-limit);
      }),
    });
    const memory: ChatMemory = { retrieveChunks: async () => [makeChunk()] };
    const llm: ChatLlm = { streamComplete: async () => makeTokenStream(['ok']) };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    await collect(service.ask('user-1', 'notebook-a', 'question'));

    expect(repo.findRecentChatMessages).toHaveBeenCalledWith('notebook-a', HISTORY_WINDOW);
  });

  it('STREAM_FAIL: persists a failed-marked assistant row with partial content and yields an error event', async () => {
    const repo = makeFakeRepo();
    const memory: ChatMemory = { retrieveChunks: async () => [makeChunk()] };
    const llm: ChatLlm = {
      streamComplete: async () => makeFailingTokenStream(['Partial ', 'answer'], new Error('boom')),
    };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-a', 'question'));

    expect(events.some((e) => e.type === 'error')).toBe(true);
    const assistantRow = repo.created.find((c) => c.role === 'assistant');
    expect(assistantRow).toBeDefined();
    expect(isFailedContent(assistantRow!.content)).toBe(true);
    expect(stripFailedMarker(assistantRow!.content)).toBe('Partial answer');
    expect(assistantRow!.content.startsWith(FAILED_CONTENT_MARKER)).toBe(true);
  });

  it('HAPPY_ASK: persists user message immediately, then assembled assistant answer on completion', async () => {
    const repo = makeFakeRepo();
    const memory: ChatMemory = { retrieveChunks: async () => [makeChunk()] };
    const llm: ChatLlm = { streamComplete: async () => makeTokenStream(['Hello ', 'world.']) };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    await collect(service.ask('user-1', 'notebook-a', 'Hi there'));

    expect(repo.created[0]).toMatchObject({ role: 'user', content: 'Hi there' });
    const assistantRow = repo.created.find((c) => c.role === 'assistant');
    expect(assistantRow?.content).toBe('Hello world.');
  });
});

async function* makeTokenStream(tokens: string[]): AsyncGenerator<string> {
  for (const t of tokens) yield t;
}

async function* makeFailingTokenStream(tokens: string[], err: Error): AsyncGenerator<string> {
  for (const t of tokens) yield t;
  throw err;
}
