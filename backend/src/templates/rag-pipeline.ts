import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { GroundedAnswerReasoningStrategy } from './GroundedAnswerReasoningStrategy';
import type { ScoredChunk } from '../ports/VectorStore';
import type { ChatMessage } from '../shared-kernel/types';

export interface RagPipelineInput {
  history: ChatMessage[];
  chunks: ScoredChunk[];
  message: string;
}

export interface RagPromptOutput {
  systemPrompt: string;
  userPrompt: string;
}

export interface RagPipelineConfig {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export class DecoupledRagPipeline {
  readonly baseUrl: string;
  readonly modelName: string;
  readonly apiKey: string;
  private readonly reasoning: GroundedAnswerReasoningStrategy;
  readonly sequence: RunnableSequence<RagPipelineInput, RagPromptOutput>;

  constructor(config: RagPipelineConfig = {}) {
    this.baseUrl = config.baseUrl ?? process.env.LLM_BASE_URL ?? '';
    this.modelName = config.model ?? process.env.LLM_MODEL ?? 'gpt-4o-mini';
    this.apiKey = config.apiKey ?? process.env.LLM_API_KEY ?? '';
    this.reasoning = new GroundedAnswerReasoningStrategy();

    // RunnableSequence with 2 steps:
    // Step 1: sliding-window preparation
    // Step 2: grounded prompt synthesis
    this.sequence = RunnableSequence.from([
      (input: RagPipelineInput) => ({
        history: input.history.slice(-7),
        chunks: input.chunks,
        message: input.message,
      }),
      (prepared: RagPipelineInput): RagPromptOutput => {
        const systemPrompt = this.reasoning.buildSystemPrompt();
        const userPrompt = this.reasoning.buildUserPrompt({
          history: prepared.history,
          chunks: prepared.chunks,
          message: prepared.message,
        });
        return { systemPrompt, userPrompt };
      },
    ]);
  }

  async formatPrompt(input: RagPipelineInput): Promise<RagPromptOutput> {
    return this.sequence.invoke(input);
  }
}

export function createRagPipeline(config?: RagPipelineConfig): DecoupledRagPipeline {
  return new DecoupledRagPipeline(config);
}
