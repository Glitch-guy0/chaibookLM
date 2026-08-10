import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { NeonRepository } from '../../adapters/neon/index';
import { JinaAdapter, stripImages } from '../../adapters/jina/index';
import { EmbeddingService } from '../../templates/EmbeddingService';
import {
  splitPlainText,
  splitMarkdown,
  chunkId,
} from '../../chunking/splitter';
import type { StorageService } from '../../ports/StorageService';
import type { Chunk } from '../../shared-kernel/types';

const RAW_KEY = (sourceId: string) => `sources/${sourceId}`;
export const SNAPSHOT_KEY = (sourceId: string) => `sources/${sourceId}/snapshot.html`;
const MAX_WEB_CONTENT_BYTES = 5_242_880; // matches DEFAULT_LIMITS.maxSourceSizeBytes
const SNAPSHOT_FETCH_TIMEOUT_MS = 8_000;

/**
 * Returns true if `ip` (dotted-quad or IPv6) falls in a private/loopback/
 * link-local range that must never be reachable from this server-side fetch
 * of a user-supplied URL (SSRF guard for the best-effort snapshot capture).
 */
function isPrivateOrLoopbackIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  return false;
}

function isPrivateOrLoopbackIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isPrivateOrLoopbackIpv4(ip);
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    // Unwrap IPv4-mapped/-compatible IPv6 (::ffff:127.0.0.1, ::127.0.0.1)
    // before range-checking -- these resolve to a real IPv4 address and must
    // not bypass the v4 checks above.
    const mapped = normalized.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateOrLoopbackIpv4(mapped[1]);
    if (normalized === '::1' || normalized === '::') return true; // loopback / unspecified
    if (normalized.startsWith('fe80:') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true; // fe80::/10
    if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7
    return false;
  }
  // Not a resolvable/parseable IP -- treat as unsafe rather than fetch blindly.
  return true;
}

/**
 * Resolves `hostname` and returns true if it (or `localhost`) is unsafe to
 * fetch server-side -- checked against *every* address the hostname resolves
 * to (not just the first), since a multi-record hostname could otherwise
 * present a safe address here while a fetch resolves a different, unsafe one.
 * Any DNS failure is treated as unsafe (skip silently). This check and the
 * follow-up `fetch()` call still perform independent resolutions, so it does
 * not fully close a DNS-rebinding race -- see Design Notes for the accepted
 * residual risk.
 */
async function isUnsafeHost(hostname: string): Promise<boolean> {
  if (hostname.toLowerCase() === 'localhost') return true;
  if (isIP(hostname)) return isPrivateOrLoopbackIp(hostname);
  try {
    const records = await dnsLookup(hostname, { all: true });
    return records.some((r) => isPrivateOrLoopbackIp(r.address));
  } catch {
    return true;
  }
}

/**
 * Single-writer ingestion pipeline. Drives a source through
 * `queued → processing → ready/failed` by loading its raw content, splitting it
 * into deterministic span-preserving chunks, embedding, and upserting to the
 * vector store. A tombstone check immediately before the chunk write prevents a
 * deleted source's chunks from ever resurrecting.
 */
export class IngestionService {
  private repo: NeonRepository;
  private storage: StorageService;
  private reader: JinaAdapter;
  private embeddingService: EmbeddingService;

  constructor(
    repo: NeonRepository,
    storage: StorageService,
    reader: JinaAdapter,
    embeddingService: EmbeddingService,
  ) {
    this.repo = repo;
    this.storage = storage;
    this.reader = reader;
    this.embeddingService = embeddingService;
  }

  async ingest(sourceId: string): Promise<void> {
    const source = await this.repo.claimSourceForIngestion(sourceId);
    if (!source) return;

    try {
      const content = await this.loadContent(source.type, sourceId);
      const chunks = this.buildChunks(
        sourceId,
        source.notebookId,
        source.type,
        content,
      );

      // Tombstone check: abort if the source was removed while ingesting.
      const current = await this.repo.findSourceById(sourceId);
      if (!current || current.status === 'failed') return;

      await this.embeddingService.embedAndStore(chunks);
      await this.repo.setSourceStatus(sourceId, 'ready');
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Ingestion failed';
      await this.repo.setSourceStatus(sourceId, 'failed', reason).catch(() => {});
    }
  }

  private async loadContent(
    type: 'text' | 'web',
    sourceId: string,
  ): Promise<string> {
    const raw = await this.storage.get(RAW_KEY(sourceId));
    if (!raw) {
      throw new Error('Source content could not be loaded from storage.');
    }
    if (type === 'web') {
      const url = raw.toString('utf8');
      const markdown = await this.reader.fetchReader(url);
      if (Buffer.byteLength(markdown, 'utf8') > MAX_WEB_CONTENT_BYTES) {
        throw new Error('The fetched page exceeds the source size limit.');
      }
      await this.captureSnapshot(sourceId, url).catch(() => {});
      return stripImages(markdown);
    }
    return raw.toString('utf8');
  }

  /**
   * Best-effort plain-`fetch` HTML snapshot of the source URL, stored under
   * `SNAPSHOT_KEY` for the Showcase panel's iframe-blocked fallback. Never
   * allowed to fail ingestion: bounded by an 8s timeout, guarded against
   * private/loopback/link-local addresses (SSRF) both for the original URL
   * and for any redirect hop (redirects are followed manually, one at a time,
   * re-validating each `Location` before following it, rather than letting
   * `fetch` auto-follow to an unchecked destination), and bailed out of early
   * via a `Content-Length` pre-check plus a hard streaming byte cap that
   * doesn't trust the header (a missing/lying `Content-Length` can't defeat
   * it). All failures (timeout, unsafe address, oversized, non-200, too many
   * redirects) are swallowed by the caller.
   */
  private async captureSnapshot(sourceId: string, url: string): Promise<void> {
    let current = url;
    for (let hop = 0; hop < 5; hop++) {
      let hostname: string;
      try {
        hostname = new URL(current).hostname;
      } catch {
        return;
      }
      if (await isUnsafeHost(hostname)) return;

      const res = await fetch(current, {
        signal: AbortSignal.timeout(SNAPSHOT_FETCH_TIMEOUT_MS),
        redirect: 'manual',
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) return;
        try {
          current = new URL(location, current).toString();
        } catch {
          return;
        }
        continue;
      }
      if (!res.ok) return;

      const contentLength = res.headers.get('content-length');
      if (contentLength && Number(contentLength) > MAX_WEB_CONTENT_BYTES) return;

      const html = await this.readBodyWithCap(res, MAX_WEB_CONTENT_BYTES);
      if (html === null) return;

      await this.storage.put(SNAPSHOT_KEY(sourceId), Buffer.from(html, 'utf8'), 'text/html');
      return;
    }
    // Too many redirect hops -- treat as unsafe/broken rather than looping.
  }

  /**
   * Reads `res`'s body incrementally, aborting and returning `null` the
   * moment accumulated bytes exceed `maxBytes` -- unlike a plain `res.text()`
   * follow by a length check, this never buffers an unbounded body in memory
   * regardless of what (or whether) `Content-Length` claims.
   */
  private async readBodyWithCap(res: Response, maxBytes: number): Promise<string | null> {
    if (!res.body) return res.text();
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
  }

  private buildChunks(
    sourceId: string,
    notebookId: string,
    type: 'text' | 'web',
    content: string,
  ): Chunk[] {
    const split =
      type === 'web' ? splitMarkdown(content) : splitPlainText(content);
    return split.map((c) => ({
      chunkId: chunkId(sourceId, c.position),
      sourceId,
      notebookId,
      span: c.span,
      position: c.position,
      text: c.text,
    }));
  }
}
