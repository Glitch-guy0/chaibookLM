import type { StorageService } from '../../ports/StorageService';

export class FilebaseAdapter implements StorageService {
  async get(_key: string): Promise<Buffer | null> {
    throw new Error('Not implemented');
  }

  async put(
    _key: string,
    _data: Buffer,
    _contentType: string,
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  async delete(_key: string): Promise<void> {
    throw new Error('Not implemented');
  }
}