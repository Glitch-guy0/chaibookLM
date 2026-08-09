export class LlmAdapter {
  async complete(
    _systemPrompt: string,
    _userPrompt: string,
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  async streamComplete(
    _systemPrompt: string,
    _userPrompt: string,
  ): Promise<AsyncIterable<string>> {
    throw new Error('Not implemented');
  }
}