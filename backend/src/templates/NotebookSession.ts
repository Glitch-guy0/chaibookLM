// Template stub: NotebookSession
// Manages a single notebook's chat context within a shikigami agent session.
// Real implementation deferred to Epic 4 (chat + reasoning).

export class NotebookSession {
  async start(_notebookId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async end(): Promise<void> {
    throw new Error('Not implemented');
  }
}