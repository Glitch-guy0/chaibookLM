import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddSourceModal, UploadDialog } from './upload-dialog';

describe('Story 2.1: AddSourceModal & Client-Side File Validation', () => {
  const queryClient = new QueryClient();

  it('renders 5 modality tabs when open (AC-2.1.1)', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <UploadDialog open={true} notebookId="nb-123" onClose={() => {}} currentSourceCount={3} />
      </QueryClientProvider>,
    );

    expect(html).toContain('data-testid="upload-tab-text"');
    expect(html).toContain('data-testid="upload-tab-web"');
    expect(html).toContain('data-testid="upload-tab-pdf"');
    expect(html).toContain('data-testid="upload-tab-transcript"');
    expect(html).toContain('data-testid="upload-tab-youtube"');
    expect(html).toContain('>Text<');
    expect(html).toContain('Web URL');
    expect(html).toContain('PDF Dropzone');
    expect(html).toContain('Transcript (.srt/.vtt)');
    expect(html).toContain('YouTube URL');
  });

  it('displays quota warning and disables submit when notebook has 10 sources (AC-2.1.4)', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <AddSourceModal open={true} notebookId="nb-123" onClose={() => {}} currentSourceCount={10} />
      </QueryClientProvider>,
    );

    expect(html).toContain('data-testid="upload-quota-warning"');
    expect(html).toContain('Quota Limit Reached: This notebook already has 10 sources');
    expect(html).toContain('disabled=""');
  });

  it('does not display quota warning when notebook has fewer than 10 sources', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <UploadDialog open={true} notebookId="nb-123" onClose={() => {}} currentSourceCount={5} />
      </QueryClientProvider>,
    );

    expect(html).not.toContain('data-testid="upload-quota-warning"');
  });
});
