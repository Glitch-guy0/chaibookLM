interface ChatCompletionChoice {
  message?: { content?: string };
  delta?: { content?: string };
}

interface ChatCompletionChunk {
  choices: ChatCompletionChoice[];
}

/**
 * OpenAI-compatible chat-completions adapter. Configured via LLM_BASE_URL /
 * LLM_API_KEY / LLM_MODEL, mirroring the EmbeddingsAdapter env pattern.
 * `streamComplete` yields raw text tokens as they arrive over SSE; it does
 * not know about chat_messages persistence or the chunked HTTP response --
 * that's ChatService's job.
 */
export class LlmAdapter {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL ?? '';
    this.apiKey = process.env.LLM_API_KEY ?? '';
    this.model = process.env.LLM_MODEL ?? 'gpt-4o-mini';
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    let out = '';
    for await (const token of await this.streamComplete(systemPrompt, userPrompt)) {
      out += token;
    }
    return out;
  }

  async streamComplete(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<string>> {
    if (!this.baseUrl) {
      throw new Error('LLM not configured: LLM_BASE_URL is not set');
    }
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `LLM request failed (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
    return streamTokens(res.body);
  }
}

async function* streamTokens(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const parsed = JSON.parse(payload) as ChatCompletionChunk;
          const token =
            parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content;
          if (token) yield token;
        } catch {
          // Ignore malformed SSE fragments.
        }
      }
    }
    // Fold-in fix: if the upstream stream ends without a final newline, the
    // last buffered-but-unflushed fragment must still be parsed and yielded
    // instead of silently dropped.
    const trailing = buffer.trim();
    if (trailing.startsWith('data:')) {
      const payload = trailing.slice(5).trim();
      if (payload && payload !== '[DONE]') {
        try {
          const parsed = JSON.parse(payload) as ChatCompletionChunk;
          const token =
            parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content;
          if (token) yield token;
        } catch {
          // Ignore malformed trailing SSE fragment.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
