import { describe, it, expect } from 'vitest';
import { GroundedAnswerReasoningStrategy } from '../GroundedAnswerReasoningStrategy';
import { CitationMapper } from '../CitationMapper';
import { createRagPipeline } from '../rag-pipeline';
import type { ScoredChunk } from '../../ports/VectorStore';
import type { ChatMessage } from '../../shared-kernel/types';

describe('LangChain Decoupled RAG Pipeline with Local/Cloud Configuration (Story 3.2)', () => {
  const sampleChunks: ScoredChunk[] = [
    {
      chunkId: 'chk_101',
      sourceId: 'src_doc_1',
      notebookId: 'nb_1',
      span: { start: 0, end: 100 },
      position: 0,
      text: 'Quantum annealing is a metaheuristic for finding the global minimum of a given objective function.',
      score: 0.91,
      metadata: { pageNumber: 4 },
    },
    {
      chunkId: 'chk_102',
      sourceId: 'src_video_2',
      notebookId: 'nb_1',
      span: { start: 100, end: 200 },
      position: 1,
      text: 'Adiabatic quantum computation relies on the adiabatic theorem to perform calculations.',
      score: 0.88,
      metadata: { timestampSeconds: 120 },
    },
  ];

  it('wraps retrieved chunks into XML tags <chunk id="..." source="..." page="...">text</chunk>', () => {
    const reasoning = new GroundedAnswerReasoningStrategy();
    const context = reasoning.buildContext(sampleChunks);

    expect(context).toContain('<chunk id="chk_101" source="src_doc_1" page="4">Quantum annealing is a metaheuristic for finding the global minimum of a given objective function.</chunk>');
    expect(context).toContain('<chunk id="chk_102" source="src_video_2" page="">Adiabatic quantum computation relies on the adiabatic theorem to perform calculations.</chunk>');
  });

  it('enforces strict grounding and [[C:chunkId]] citation tags in system prompt', () => {
    const reasoning = new GroundedAnswerReasoningStrategy();
    const systemPrompt = reasoning.buildSystemPrompt();

    expect(systemPrompt).toContain('[[C:chunkId]]');
    expect(systemPrompt).toContain('unsupported claims are forbidden');
  });

  it('formats prompt with a sliding window of up to 7 conversation turns', () => {
    const reasoning = new GroundedAnswerReasoningStrategy();
    const turns: ChatMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `msg_${i}`,
      notebookId: 'nb_1',
      userId: 'user_1',
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      createdAt: new Date(),
    }));

    const userPrompt = reasoning.buildUserPrompt({
      history: turns.slice(-7), // 7-turn sliding window
      chunks: sampleChunks,
      message: 'Explain quantum annealing',
    });

    expect(userPrompt).toContain('PRIOR CONVERSATION:');
    expect(userPrompt).toContain('Message 9');
    expect(userPrompt).toContain('Message 3');
    expect(userPrompt).not.toContain('Message 2'); // older turns beyond 7 excluded
    expect(userPrompt).toContain('CONTEXT:');
    expect(userPrompt).toContain('QUESTION:\nExplain quantum annealing');
  });

  it('CitationMapper maps both [[C:chunkId]] and [[chunkId]] markers to CitationSnapshot[]', () => {
    const mapper = new CitationMapper();
    const answer = 'Quantum annealing finds minimums [[C:chk_101]]. Adiabatic theorem is also key [[chk_102]]. Hallucinated [[C:chk_999]].';

    const citations = mapper.map(answer, sampleChunks);

    expect(citations).toHaveLength(2);
    expect(citations[0].chunkId).toBe('chk_101');
    expect(citations[0].pageNumber).toBe(4);
    expect(citations[1].chunkId).toBe('chk_102');
    expect(citations[1].timestampSeconds).toBe(120);
  });

  it('createRagPipeline builds a runnable LangChain sequence respecting environment configuration', async () => {
    process.env.LLM_BASE_URL = 'https://api.openai.com/v1';
    process.env.LLM_MODEL = 'gpt-4o-mini';
    process.env.LLM_API_KEY = 'test-key';

    const pipeline = createRagPipeline();
    expect(pipeline).toBeDefined();
    expect(pipeline.modelName).toBe('gpt-4o-mini');
    expect(pipeline.baseUrl).toBe('https://api.openai.com/v1');

    const formatted = await pipeline.formatPrompt({
      history: [],
      chunks: sampleChunks,
      message: 'Test question',
    });

    expect(formatted.systemPrompt).toContain('[[C:chunkId]]');
    expect(formatted.userPrompt).toContain('<chunk id="chk_101"');
  });
});
