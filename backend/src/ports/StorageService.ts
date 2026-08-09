export interface StorageService {
  get(key: string): Promise<Buffer | null>;
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}