import { RevealSection } from './reveal-section';

interface StoryStep {
  step: string;
  tag: string;
  title: string;
  body: string;
}

const STEPS: StoryStep[] = [
  {
    step: '01',
    tag: 'MULTI-MODAL INGESTION',
    title: 'Ingest Anything',
    body: 'Drop in PDFs, web pages, YouTube links, or raw text. Contextual parses, chunks, and indexes every token with semantic vector embeddings.',
  },
  {
    step: '02',
    tag: 'GROUNDED RAG',
    title: 'Ask in Context',
    body: 'Every query searches across all loaded sources simultaneously. If an answer isn’t in your sources, Contextual tells you — no confident nonsense.',
  },
  {
    step: '03',
    tag: 'DEEP ORIGINAL VIEW',
    title: 'Verify in Original',
    body: 'Click any inline citation pill to jump straight to the source passage: highlighted bounding boxes in PDFs or synced video transcripts.',
  },
];

const FEATURES = [
  {
    title: 'Grounded Honest AI',
    body: 'Strict context isolation. If an answer isn’t in your sources, the model tells you. No fabrication, no hallucinated filler.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" stroke="currentColor" strokeWidth="2" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Ephemeral by Design',
    body: 'Notebooks auto-purge at midnight IST. No stale state, no lingering indexes, zero residue.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Tactile Workstation',
    body: 'Solid offset shadows, monospaced chrome, instant feedback. Built like professional precision software.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" />
        <path d="M9 9h6v6H9z" fill="currentColor" />
      </svg>
    ),
  },
];

/**
 * Story and feature sections matching mockup-landing.html:
 * Ingest -> Ask -> Verify, SVG feature cards, and Quote Band.
 */
export function LandingStory() {
  return (
    <div id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-24">
      {/* Workflow Steps */}
      <section className="space-y-12">
        <div className="max-w-2xl">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted">
            The Verification Pipeline
          </span>
          <h2 className="mt-2 font-mono text-3xl sm:text-4xl font-bold text-ink dark:text-ink-dark">
            Built for truth, not hallucinated conversation.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((item) => (
            <RevealSection key={item.step}>
              <div className="h-full flex flex-col justify-between p-6 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-[6px_6px_0_0_var(--border,#111111)] dark:shadow-[6px_6px_0_0_var(--border-dark,#E4E4E7)] transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-muted">
                      {item.step}
                    </span>
                    <span className="inline-block px-2 py-0.5 border border-border dark:border-border-dark bg-bg dark:bg-surface text-[10px] font-mono font-bold tracking-wider uppercase text-ink dark:text-ink-dark">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-mono text-xl font-bold text-ink dark:text-ink-dark">
                    {item.title}
                  </h3>
                  <p className="font-sans text-sm text-ink-secondary dark:text-ink-secondary-dark leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Quote Band (from mockup-landing.html) */}
      <RevealSection>
        <div className="border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-[8px_8px_0_0_var(--border,#111111)] dark:shadow-[8px_8px_0_0_var(--border-dark,#E4E4E7)] p-8 sm:p-10 text-center">
          <div className="font-mono font-bold text-lg sm:text-2xl text-ink dark:text-ink-dark max-w-2xl mx-auto mb-3 leading-snug">
            “When I cite an answer, I need to see the exact page, sentence, and equation. <span className="pill text-sm sm:text-base py-0.5 px-2 align-baseline">Contextual</span> is the only tool that actually does this.”
          </div>
          <div className="font-mono text-xs text-muted">
            Dr. Maya Lin · Distributed Systems Researcher
          </div>
        </div>
      </RevealSection>

      {/* Feature Highlights Grid */}
      <section id="features" className="space-y-12">
        <div className="max-w-2xl">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted">
            Engineered Guardrails
          </span>
          <h2 className="mt-2 font-mono text-3xl sm:text-4xl font-bold text-ink dark:text-ink-dark">
            Safety, privacy, and verified provenance.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feat) => (
            <RevealSection key={feat.title}>
              <div className="h-full p-6 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-[6px_6px_0_0_var(--border,#111111)] dark:shadow-[6px_6px_0_0_var(--border-dark,#E4E4E7)] space-y-3">
                <div className="inline-grid place-items-center h-11 w-11 border-2 border-border dark:border-border-dark bg-bg dark:bg-surface text-ink dark:text-ink-dark shadow-[3px_3px_0_0_var(--border,#111111)] dark:shadow-[3px_3px_0_0_var(--border-dark,#E4E4E7)]">
                  {feat.icon}
                </div>
                <h3 className="font-mono text-lg font-bold text-ink dark:text-ink-dark">
                  {feat.title}
                </h3>
                <p className="font-sans text-sm text-ink-secondary dark:text-ink-secondary-dark leading-relaxed">
                  {feat.body}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>
    </div>
  );
}
