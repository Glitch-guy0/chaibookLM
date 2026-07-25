export interface RetrievedChunk {
  score: number;
  text: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  pageNumber?: number;
  timestampStart?: number;
}

const MAIN_MODEL_BASE_URL =
  process.env.MAIN_MODEL_BASE_URL || "https://api.openai.com/v1";
const MAIN_MODEL_NAME = process.env.MAIN_MODEL_NAME || "gpt-4o-mini";
const MAIN_MODEL_API_KEY = process.env.MAIN_MODEL_API_KEY || "";

export function formatSystemPrompt(chunks: RetrievedChunk[]): string {
  const contextStr = chunks
    .map(
      (c, idx) =>
        `[Citation ${idx + 1}] Source: "${c.sourceTitle}" (${c.sourceType}${
          c.pageNumber ? `, Page ${c.pageNumber}` : ""
        }${c.timestampStart ? `, Timestamp ${c.timestampStart}s` : ""}):\n${c.text}`
    )
    .join("\n\n");

  return `You are chaibookLM, a grounded research AI assistant. Your goal is to answer the user's question accurately using ONLY the retrieved context sources provided below.

CRITICAL INSTRUCTIONS:
1. Every fact or claim in your response MUST be grounded in the provided sources.
2. You MUST cite your claims using inline numerical citation markers corresponding to the context indices, formatted strictly as [1], [2], etc.
3. If the context does not contain enough information to answer the question, state clearly: "I could not find sufficient information in your uploaded sources to answer this question."
4. Keep your answer structured, clear, and easy to read.

RETRIEVED SOURCE CONTEXT:
${contextStr}`;
}

export async function createGroundedCompletionStream(
  prompt: string,
  chunks: RetrievedChunk[]
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = formatSystemPrompt(chunks);

  const isMock =
    !MAIN_MODEL_API_KEY ||
    MAIN_MODEL_API_KEY.includes("your_") ||
    MAIN_MODEL_API_KEY === "placeholder";

  if (isMock) {
    // Return mock streaming response if no valid API key present
    const mockAnswer = `Based on your uploaded sources ${chunks
      .map((_, i) => `[${i + 1}]`)
      .join(
        " and "
      )}, the key findings and details are well-documented within your workspace. Every claim is grounded and traceable directly to your files.`;
    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        const tokens = mockAnswer.split(" ");
        for (const token of tokens) {
          controller.enqueue(encoder.encode(token + " "));
          await new Promise((r) => setTimeout(r, 60));
        }
        controller.close();
      },
    });
  }

  const response = await fetch(`${MAIN_MODEL_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAIN_MODEL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MAIN_MODEL_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: true,
      temperature: 0.2,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Completion API error: ${response.statusText}`);
  }

  const rawStream = response.body;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = rawStream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed?.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (err) {
                // Ignore parse errors for incomplete chunks
              }
            } else {
              // Plain text token fallback
              controller.enqueue(encoder.encode(trimmed));
            }
          }
        }

        if (buffer.trim().startsWith("data: ")) {
          const jsonStr = buffer.trim().slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          } catch {}
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}
