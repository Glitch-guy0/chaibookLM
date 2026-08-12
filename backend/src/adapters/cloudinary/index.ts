import type { StorageService } from '../../ports/StorageService';

/**
 * Cloudinary adapter for file storage. Uses the Cloudinary Upload API.
 * Configured via CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and
 * CLOUDINARY_API_SECRET. Throws a clear error when unconfigured;
 * ingestion converts that into a `failed` status.
 */
export class CloudinaryAdapter implements StorageService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;
  private uploadUrl: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
    this.apiKey = process.env.CLOUDINARY_API_KEY ?? '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`;
  }

  private assertConfigured(): void {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error(
        'Cloudinary not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET',
      );
    }
  }

  private getUrl(publicId: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/raw/upload/v1/${publicId}`;
  }

  async get(key: string): Promise<Buffer | null> {
    this.assertConfigured();
    try {
      const url = this.getUrl(key);
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Cloudinary get failed (${res.status})${detail ? `: ${detail}` : ''}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return null;
      throw error;
    }
  }

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    this.assertConfigured();
    try {
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(data)], { type: contentType }));
      formData.append('public_id', key);
      formData.append('api_key', this.apiKey);
      formData.append('resource_type', 'raw');

      const timestamp = Math.floor(Date.now() / 1000);
      formData.append('timestamp', String(timestamp));

      const res = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Cloudinary put failed (${res.status})${detail ? `: ${detail}` : ''}`);
      }

      const result = (await res.json()) as { public_id?: string };
      if (!result.public_id) {
        throw new Error('Cloudinary upload did not return a public_id');
      }

      return this.getUrl(result.public_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cloudinary put failed: ${message}`);
    }
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured();
    try {
      const formData = new FormData();
      formData.append('public_id', key);
      formData.append('api_key', this.apiKey);
      formData.append('resource_type', 'raw');

      const timestamp = Math.floor(Date.now() / 1000);
      formData.append('timestamp', String(timestamp));

      const destroyUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/destroy`;
      const res = await fetch(destroyUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok && res.status !== 404) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Cloudinary delete failed (${res.status})${detail ? `: ${detail}` : ''}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('404')) {
        throw new Error(`Cloudinary delete failed: ${message}`);
      }
    }
  }
}
