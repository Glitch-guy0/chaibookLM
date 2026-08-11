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
    findChatMessagesBefore: vi.fn(async () => ({ messages: [], hasMore: false })),
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

  it('REFUSAL_FLAG: the zero-chunks done event carries refusal: true (never inferred by string-matching)', async () => {
    const repo = makeFakeRepo();
    const memory: ChatMemory = { retrieveChunks: async () => [] };
    const llm: ChatLlm = { streamComplete: vi.fn() };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-empty', 'Anything in here?'));

    const done = events.find((e) => e.type === 'done');
    expect(done?.refusal).toBe(true);
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

  it('HISTORY: delegates to repo.findChatMessagesBefore with HISTORY_WINDOW and the given cursor, returning its result verbatim', async () => {
    const page = { messages: [{ id: 'm1' } as ChatMessage], hasMore: true };
    const repo = makeFakeRepo({
      findChatMessagesBefore: vi.fn(async () => page),
    });
    const memory: ChatMemory = { retrieveChunks: async () => [] };
    const llm: ChatLlm = { streamComplete: vi.fn() };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const result = await service.history('notebook-a', 'user-1', 'cursor-msg-id');

    expect(repo.findChatMessagesBefore).toHaveBeenCalledWith(
      'notebook-a',
      HISTORY_WINDOW,
      'cursor-msg-id',
    );
    expect(result).toBe(page);
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
    const events = await collect(service.ask('user-1', 'notebook-a', 'Hi there'));

    expect(repo.created[0]).toMatchObject({ role: 'user', content: 'Hi there' });
    const assistantRow = repo.created.find((c) => c.role === 'assistant');
    expect(assistantRow?.content).toBe('Hello world.');

    const done = events.find((e) => e.type === 'done');
    expect(done?.refusal).toBeUndefined();
  });

  it('VALID_MARKERS: persists and streams a CitationSnapshot for each marker validated against this turn\'s retrieved chunks', async () => {
    const repo = makeFakeRepo();
    const chunk = makeChunk({ chunkId: 'chunk-1', sourceId: 'source-1', span: { start: 0, end: 5 } });
    const memory: ChatMemory = { retrieveChunks: async () => [chunk] };
    const llm: ChatLlm = {
      streamComplete: async () => makeTokenStream(['Answer ', 'with a cite [[chunk-1]].']),
    };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-a', 'question'));

    const done = events.find((e) => e.type === 'done');
    const expectedCitation = { chunkId: 'chunk-1', sourceId: 'source-1', span: { start: 0, end: 5 } };
    expect(done?.citations).toEqual([expectedCitation]);

    const assistantRow = repo.created.find((c) => c.role === 'assistant');
    expect(assistantRow?.content).toBe('Answer with a cite [[chunk-1]].');
    // createChatMessage's 5th arg (citations) must match what was streamed.
    const createCalls = (repo.createChatMessage as ReturnType<typeof vi.fn>).mock.calls;
    const assistantCall = createCalls.find((args) => args[2] === 'assistant');
    expect(assistantCall?.[4]).toEqual([expectedCitation]);
  });

  it('UNKNOWN_MARKER: a chunkId not in the turn\'s retrieved set is dropped from citations entirely', async () => {
    const repo = makeFakeRepo();
    const memory: ChatMemory = { retrieveChunks: async () => [makeChunk({ chunkId: 'chunk-1' })] };
    const llm: ChatLlm = {
      streamComplete: async () => makeTokenStream(['Hallucinated cite [[chunk-unknown]].']),
    };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-a', 'question'));

    const done = events.find((e) => e.type === 'done');
    expect(done?.citations).toEqual([]);
  });

  it('DUPLICATE_MARKER: the same valid chunkId cited twice yields one CitationSnapshot per occurrence', async () => {
    const repo = makeFakeRepo();
    const chunk = makeChunk({ chunkId: 'chunk-1', sourceId: 'source-1' });
    const memory: ChatMemory = { retrieveChunks: async () => [chunk] };
    const llm: ChatLlm = {
      streamComplete: async () => makeTokenStream(['[[chunk-1]] and again [[chunk-1]].']),
    };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-a', 'question'));

    const done = events.find((e) => e.type === 'done');
    expect(done?.citations).toHaveLength(2);
    expect(done?.citations?.every((c) => c.chunkId === 'chunk-1')).toBe(true);
  });

  it('REFUSAL: a structural refusal never carries a citations field on its done event', async () => {
    const repo = makeFakeRepo();
    const memory: ChatMemory = { retrieveChunks: async () => [] };
    const llm: ChatLlm = { streamComplete: vi.fn() };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-empty', 'question'));

    const done = events.find((e) => e.type === 'done');
    expect(done?.citations).toBeUndefined();
  });

  it('NO_MARKERS: a grounded answer with zero markers persists an empty citations array', async () => {
    const repo = makeFakeRepo();
    const memory: ChatMemory = { retrieveChunks: async () => [makeChunk()] };
    const llm: ChatLlm = { streamComplete: async () => makeTokenStream(['No citations here.']) };

    const service = new ChatService(repo, memory, fakeReasoning, llm);
    const events = await collect(service.ask('user-1', 'notebook-a', 'question'));

    const done = events.find((e) => e.type === 'done');
    expect(done?.citations).toEqual([]);
  });
});

async function* makeTokenStream(tokens: string[]): AsyncGenerator<string> {
  for (const t of tokens) yield t;
}

async function* makeFailingTokenStream(tokens: string[], err: Error): AsyncGenerator<string> {
  for (const t of tokens) yield t;
  throw err;
}
