// NotebookSession
//
// Implemented as a shikigami `Session`-shaped class (IBaseSession contract)
// per the template stub's original intent, but per the 2026-08-10 amendment
// it is NOT wired into a shikigami `Agent` on the grounded-chat path -- no
// Agent is constructed in ChatService. It is used only to validate/shape the
// last-7-turns window handed into the prompt (AD-9): `setState('turns', ...)`
// is expected to receive an already-windowed (<=7) array, and `getState`
// hands it back for GroundedAnswerReasoningStrategy's prompt builders.

export interface SessionSnapshot {
  data: Record<string, unknown>;
  timestamp: string;
}

export interface IBaseSession {
  notebookId: string;
  getState(key: string): Promise<unknown | undefined>;
  setState(key: string, value: unknown): Promise<void>;
  clearState(): Promise<void>;
  snapshot(): SessionSnapshot;
}
import type { ChatMessage } from '../shared-kernel/types';

export const MAX_TURNS = 7;

export class NotebookSession implements IBaseSession {
  private state: Record<string, unknown> = {};

  constructor(readonly notebookId: string) {}

  /** Shapes/validates the recent-turns window to at most MAX_TURNS, most-recent-last. */
  async setTurns(turns: ChatMessage[]): Promise<void> {
    const windowed = turns.slice(-MAX_TURNS);
    await this.setState('turns', windowed);
  }

  async getTurns(): Promise<ChatMessage[]> {
    const turns = await this.getState('turns');
    return Array.isArray(turns) ? (turns as ChatMessage[]) : [];
  }

  async getState(key: string): Promise<unknown | undefined> {
    return this.state[key];
  }

  async setState(key: string, value: unknown): Promise<void> {
    this.state[key] = value;
  }

  async clearState(): Promise<void> {
    this.state = {};
  }

  snapshot(): SessionSnapshot {
    return {
      data: { ...this.state },
      timestamp: new Date().toISOString(),
    };
  }
}
