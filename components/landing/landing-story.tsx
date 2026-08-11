import { RevealSection } from './reveal-section';

interface StoryStep {
  step: string;
  title: string;
  body: string;
}

const STEPS: StoryStep[] = [
  {
    step: '01',
    title: 'Bring your sources',
    body: 'Drop in PDFs, articles, or links. chaibookLM ingests and indexes every source so its content becomes searchable context for your notebook.',
  },
  {
    step: '02',
    title: 'Ask, in plain language',
    body: 'Chat with your notebook the way you would a research partner. Every answer is generated only from what your sources actually say.',
  },
  {
    step: '03',
    title: 'Follow the citation',
    body: 'Each claim in an answer carries a citation chip pointing at the exact chunk it came from — no guessing where an answer originated.',
  },
  {
    step: '04',
    title: 'See the original, verbatim',
    body: 'Tap a citation to open the Showcase and read the original passage in full context, so you can verify before you trust.',
  },
];

/**
 * 2-3(+) story sections explaining the grounded, verifiable flow:
 * source -> chat -> citation -> original view. Each step is its own
 * scroll-revealed section.
 */
export function LandingStory() {
  return (
    <section data-debug="LandingStory" className="mx-auto flex max-w-4xl flex-col gap-16 px-4 py-16 sm:px-8 sm:py-24">
      {STEPS.map((item) => (
        <RevealSection key={item.step} data-debug={`LandingStoryStep-${item.step}`}>
          <div className="flex flex-col gap-3 border-l-4 border-brand dark:border-brand-dark pl-6">
            <span className="font-mono text-sm text-ink-muted dark:text-ink-muted-dark">
              {item.step}
            </span>
            <h2 className="font-display text-2xl text-ink dark:text-ink-dark sm:text-3xl">
              {item.title}
            </h2>
            <p className="max-w-xl font-sans text-base text-ink-secondary dark:text-ink-secondary-dark">
              {item.body}
            </p>
          </div>
        </RevealSection>
      ))}
    </section>
  );
}
