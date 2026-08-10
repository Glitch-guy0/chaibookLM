import { createHash, createHmac } from 'node:crypto';
import type { StorageService } from '../../ports/StorageService';

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function encodePathPart(part: string): string {
  return encodeURIComponent(part).replace(/\+/g, '%20');
}

/** Encode an object key as a SigV4 canonical URI (slashes preserved). */
function encodeKey(key: string): string {
  return key
    .split('/')
    .map(encodePathPart)
    .join('/');
}

function formatAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

/**
 * Minimal S3-compatible client (SigV4) targeting Filebase. Configured via
 * FILEBASE_ACCESS_KEY / FILEBASE_SECRET_KEY / FILEBASE_BUCKET /
 * FILEBASE_ENDPOINT (and optional FILEBASE_REGION, default us-east-1). Throws a
 * clear error when unconfigured; ingestion converts that into a `failed` status.
 */
export class FilebaseAdapter implements StorageService {
  private accessKey: string;
  private secretKey: string;
  private bucket: string;
  private endpoint: string;
  private region: string;

  constructor() {
    this.accessKey = process.env.FILEBASE_ACCESS_KEY ?? '';
    this.secretKey = process.env.FILEBASE_SECRET_KEY ?? '';
    this.bucket = process.env.FILEBASE_BUCKET ?? '';
    this.endpoint = (process.env.FILEBASE_ENDPOINT ?? '').replace(/\/+$/, '');
    this.region = process.env.FILEBASE_REGION ?? 'us-east-1';
  }

  private assertConfigured(): void {
    if (!this.accessKey || !this.secretKey || !this.bucket || !this.endpoint) {
      throw new Error(
        'Filebase not configured: set FILEBASE_ACCESS_KEY, FILEBASE_SECRET_KEY, FILEBASE_BUCKET and FILEBASE_ENDPOINT',
      );
    }
  }

  private async s3Request(
    method: 'GET' | 'PUT' | 'DELETE',
    key: string,
    body?: Buffer,
    contentType?: string,
  ): Promise<Response> {
    this.assertConfigured();
    const now = new Date();
    const amzDate = formatAmzDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const scope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const host = new URL(this.endpoint).host;
    const canonicalUri = `/${this.bucket}/${encodeKey(key)}`;
    const payloadHash = sha256Hex(body ?? '');
    const canonicalHeaders = [
      `content-type:${contentType ?? ''}`,
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ].join('\n');
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      method,
      canonicalUri,
      '',
      canonicalHeaders + '\n',
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const dateKey = hmac('AWS4' + this.secretKey, dateStamp);
    const regionKey = hmac(dateKey, this.region);
    const serviceKey = hmac(regionKey, 's3');
    const signingKey = hmac(serviceKey, 'aws4_request');
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const headers: Record<string, string> = {
      Host: host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authorization,
    };
    if (contentType) headers['Content-Type'] = contentType;

    return fetch(`${this.endpoint}${canonicalUri}`, {
      method,
      headers,
      body: body ? new Uint8Array(body) : undefined,
    });
  }

  async get(key: string): Promise<Buffer | null> {
    const res = await this.s3Request('GET', key);
    if (res.status === 404) return null;
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Filebase get failed (${res.status})${detail ? `: ${detail}` : ''}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    const res = await this.s3Request('PUT', key, data, contentType);
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Filebase put failed (${res.status})${detail ? `: ${detail}` : ''}`);
    }
    return `${this.endpoint}/${this.bucket}/${encodeKey(key)}`;
  }

  async delete(key: string): Promise<void> {
    const res = await this.s3Request('DELETE', key);
    if (!res.ok && res.status !== 404) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Filebase delete failed (${res.status})${detail ? `: ${detail}` : ''}`);
    }
  }
}
