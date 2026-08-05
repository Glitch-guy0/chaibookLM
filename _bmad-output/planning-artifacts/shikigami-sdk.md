# shikigami

TypeScript Agent SDK with hexagonal architecture — core defines ports, adapters are injected.

## install
```sh
npm i @glitch-guy0/shikigami
```

## Memory (retrieval-order rule)

Plug in memory via `MemoryManager` (a well-known tool). Core ships only the interface — bring your own `MemoryStrategy` implementations (e.g. a Kairo template like `SimpleStore`).

```ts
import { MemoryManager } from 'shikigami/retrieval';

const agent = new Agent({
  agentConfig: {
    model: 'gpt-4o',
    memoryManager: new MemoryManager({ strategies: [new SimpleStore()] }),
  },
});
```

The agent follows the **retrieval-order rule** (memory first → tools → explicit unknown):

- `memoryManager.retrieve({ query, correlationId })` runs at the start of every `execute()`.
- `memoryManager.store({ query, result, correlationId })` runs after each task and after the final response.
- On a memory miss, the prompt includes an explicit-unknown instruction (swappable via `AgentConfig.memoryInstructionTemplate`, default `DEFAULT_MEMORY_INSTRUCTION`).

**Swap-by-replacement (FR-14):** swapping memory is a one-line change — no agent code touched.

```ts
// before
new MemoryManager({ strategies: [new SimpleStore()] })
// after
new MemoryManager({ strategies: [new VectorStore()] })
```

## Sessions (conversation continuity)

Wire a `Session` port to persist conversation history and task position across calls. Core defines the contract; implementations are Kairo templates (Epic 7) — a stub satisfies it in tests.

```ts
const agent = new Agent({
  agentConfig: {
    model: 'gpt-4o',
    session: mySessionTemplate,
  },
});
```

- Prior turns are carried forward without re-supplying.
- An interrupted run resumes at the last uncompleted task (`pendingTask` in session state).
- Session failures are non-fatal — the run continues (surfaced via the `ERROR` event).

## Tools (creation contract & pipeline)

Build custom tools with the creation contract — `(action, inputParser, outputParser, [inputInterceptors], [outputInterceptors])` — via `createTool`. A missing required slot fails loudly at creation.

```ts
import { createTool, ToolExecutor } from 'shikigami/tools';

const sum = createTool({
  name: 'sum',
  description: 'adds 1 to the input',
  inputParser: { parse: (i) => Number(i), serialize: (o) => o },
  outputParser: { parse: (i) => i, serialize: (o) => `result:${o}` },
  action: async (input) => ({ result: (input as number) + 1 }),
});

const context = { correlationId: 'demo', agentConfig: {} };
const out = await new ToolExecutor().execute(sum, '41', context);
// out.result === 'result:42'
```

Tool calls execute in a **fixed pipeline order** (FR-24): input interceptor → input parser → action → output parser → output interceptor → output validator. Cross-tool execution is sequential in v1.

Method convention: `inputParser.parse` runs on the way in, `outputParser.serialize` on the way out (the other method on each parser is unused by the pipeline), and `outputParser.serialize` must return a `ToolOutput`-shaped value.

- **Interceptors** are block/allow guards (hit-run exactly once on block, FR-25).
- **`ToolOutputValidator`** runs last; the default is passthrough — validation is opt-in (AR-17). Parser/validator failures surface as typed `ToolError`.
- **`ToolRegistry`** registers tools by name and looks them up (`TOOL_NOT_FOUND` on a miss).
- **Agents invoke configured tools** (`agentConfig.tools`) through this pipeline via a prompt-level protocol: the model responds with a `TOOL_CALL:` line + JSON, the agent runs the tool through `ToolExecutor` and feeds the result back as a `role: 'tool'` message — bounded by `maxToolCallsPerTask` (default 3). Tool failures are non-fatal; a malformed invocation is treated as a plain-text answer. On loop-budget exhaustion the task result is an explicit marker string (`Tool loop limit of N reached...`) rather than an error envelope. Sub-agent tool interceptor blocks do not invoke the parent's `hitRun` (hitRun is a parent-run concern, consistent with the guardrail-bypass limitation).
- **Native function calling (opt-in):** set `toolCallingMode: 'native'` to use OpenAI-compatible `tools`/`tool_calls` instead of the prompt-level protocol. Add an optional `inputSchema` (JSON Schema) to `createTool` so the model knows the input shape; absent schemas default to `{ type: 'object' }` and the `inputParser` remains the runtime validator (core adds no schema-validation dependency). Native mode requires an OpenAI-compatible endpoint (Groq, Together, OpenRouter, most local servers); streaming tool calls are not yet supported — native mode uses non-streaming calls.

## Streaming & Events (opt-in)

Attach listeners via `agent.addListener(EventType.STREAM, fn)` to consume token/execution streaming, metrics, and errors as they happen. Events are **async-buffered** — no real-time delivery guarantees in v1 (FR-47). Each event carries a `correlationId` (run id) and a monotonic `sequenceNumber` within that run's scope; filter by correlation ID to reconstruct causal order (AR-19). STREAM and METRICS listeners are fully separate — a STREAM listener is never invoked by a METRICS emission and vice versa, and event data never contains API keys or sensitive data.

```ts
import { EventType } from 'shikigami';

const agent = new Agent({
  agentConfig: { model: 'gpt-4o', streaming: true },
});
const unsub = agent.addListener(EventType.STREAM, (event) => {
  const token = (event.data as { token: string }).token;
  process.stdout.write(token);
});

await agent.execute('Tell me a story');
unsub(); // stop listening
```

- **Opt-in flag:** set `streaming: true` on `AgentConfig` (or per-run via `execute(task, { streaming: true })`); default `false` keeps the common run byte-identical (NFR-10). Sub-agents inherit the flag through config inheritance.
- **What streams:** the user-facing answer LLM calls (the task answer and the multi-result merge). Internal probes (`understand`, failure decisions, tool-loop iterations) are not streamed — with an active tool loop, streaming applies to the non-tool-loop answer path only (documented v1 limitation).
- `execute()` still returns the full assembled response in the envelope — streaming is additive, it does not change the public verb surface (AR-3).

**Block/error telemetry (Story 8.3):** when a guardrail or tool interceptor blocks, or an agent error is caught (task failure, reasoning failure, sub-agent abort, orchestration error), the run emits an `ERROR` event (`{ message, source, code }`) and a `METRICS` event (`{ kind: 'block' | 'error', source, code }`) at the catch point. Filter `METRICS` by `kind` to tell telemetry from the run-summary event — a run can emit both. Known limitation: telemetry cannot distinguish a guardrail block from a guardrail failure beyond the error `code` (PRD §4.2).

**Token usage (Story 8.2):** every run's final `METRICS` event carries an aggregate `usage` field (`{ prompt_tokens, completion_tokens, total_tokens }`) summed across that run's LLM calls — usage only, never cost (NFR-8). Sub-agents track usage on their own run scope; the parent's `METRICS` reflects the parent's own calls. Streamed runs request usage via the standard `stream_options: { include_usage: true }` parameter; if the provider ignores it, the streamed contribution is simply zero. Strict servers that reject the field are handled with a transparent one-time retry without it, so streaming keeps working (NFR-10).

## Kairo Templates (batteries included)

Install the companion adapter package and wire the four launch templates with **import-and-inject** — no boilerplate, and every template is swappable via one-line instantiation (swap-by-replacement).

```ts
import { Agent } from 'shikigami';
import { MemoryManagerImpl } from 'shikigami/retrieval';
import { ReasoningManager } from 'shikigami/reasoning';
import { SimpleStore } from '@shikigami/kairo/memory';
import { WebSearchTool } from '@shikigami/kairo/tools';
import { SimpleReasoningStrategy } from '@shikigami/kairo/reasoning';
import { SimpleInputGuardrail } from '@shikigami/kairo/guardrails';

const agent = new Agent({
  agentConfig: {
    model: 'gpt-4o',
    memoryManager: new MemoryManagerImpl({ strategies: [new SimpleStore()] }),
    tools: [new WebSearchTool({ search: mySearchImpl })],
    reasoningManager: new ReasoningManager({ strategies: [new SimpleReasoningStrategy()] }),
    guardrails: [new SimpleInputGuardrail({ blockedTerms: ['politics'] })],
  },
});
```

- **`SimpleStore`** (`@shikigami/kairo/memory`) — in-memory `MemoryStrategy`: stores entries in an internal array; retrieve returns the entire array (no selective retrieval, embedding search, or ranking — FR-16a).
- **`WebSearchTool`** (`@shikigami/kairo/tools`) — a `Tool` built via the creation contract (`createTool`): inject your own `search` implementation; without one it returns a deterministic placeholder (offline, no API key).
- **`SimpleReasoningStrategy`** (`@shikigami/kairo/reasoning`) — deterministic `ReasoningStrategy` that synthesizes the context; wire it into `ReasoningManager`.
- **`SimpleInputGuardrail`** (`@shikigami/kairo/guardrails`) — block/allow-only `Guardrail` with configurable blocked terms; it never transforms the prompt (FR-29).

> Note: the memory-manager *class* is exported from `shikigami/retrieval` as `MemoryManagerImpl` (`MemoryManager` is the interface type).

## Known Limitations

- **Guardrails run on every `execute()` call.** `invokeAgent` / `delegate` are aliases that call `execute()` on the same agent, so the guardrail gate applies to those prompts too. The spec'd known limitation — that prompts of separately spawned sub-agents (via the Watchdog, Epic 4) bypass the guardrail layer — applies only once distinct sub-agent instances exist. Until then, treat every prompt submitted through this agent as guardrailed.