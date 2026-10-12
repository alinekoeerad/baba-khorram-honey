/**
 * Storage Provider Abstraction (Phase 3, Task 1)
 * Decouples file persistence from callers, supporting LocalDiskStorage now
 * and allowing drop-in S3-compatible providers later without touching callers.
 * Implements strict path-traversal prevention.
 */

import fs from 'fs';
import path from 'path';

export interface SavedFileResult {
  key: string;
  url: string;
  bytes: number;
}

export interface StorageProvider {
  save(buffer: Buffer, key: string, contentType: string): Promise<SavedFileResult>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getBuffer(key: string): Promise<Buffer>;
  getPublicUrl(key: string): string;
}

export class LocalDiskStorage implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(process.cwd(), baseDir || process.env.UPLOAD_DIR || './uploads');
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Resolves key to absolute path and prevents path-traversal attacks.
   */
  public resolveSafePath(key: string): string {
    const cleanKey = path.basename(key);
    const fullPath = path.resolve(this.baseDir, cleanKey);

    // Strictly ensure resolved path resides inside baseDir
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error(`Path traversal security violation: ${key}`);
    }

    return fullPath;
  }

  async save(buffer: Buffer, key: string, _contentType: string): Promise<SavedFileResult> {
    this.ensureDirectory();
    const filePath = this.resolveSafePath(key);
    await fs.promises.writeFile(filePath, buffer);
    return {
      key: path.basename(key),
      url: this.getPublicUrl(key),
      bytes: buffer.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.resolveSafePath(key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.resolveSafePath(key);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    const filePath = this.resolveSafePath(key);
    return await fs.promises.readFile(filePath);
  }

  getPublicUrl(key: string): string {
    const cleanKey = path.basename(key);
    return `/uploads/${encodeURIComponent(cleanKey)}`;
  }
}

// Singleton storage provider instance
let storageProviderInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageProviderInstance) {
    const providerType = process.env.STORAGE_PROVIDER || 'local';
    if (providerType === 's3') {
      // S3 provider placeholder (can be implemented in future without altering callers)
      throw new Error('S3 storage provider is reserved for future cloud deployment.');
    }
    storageProviderInstance = new LocalDiskStorage();
  }
  return storageProviderInstance;
}
