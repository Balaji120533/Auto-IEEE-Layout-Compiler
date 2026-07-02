import { createWriteStream, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';

// Root directory where project images are stored in dev (local FS).
// In prod this path is shared with the engine (or swapped for an S3 interface).
export const STORAGE_ROOT = resolve(__dirname, '../../storage');

// ── Interface ─────────────────────────────────────────────────────────────────

export interface ObjectStorage {
  /** Save a file stream under projectId/filename; return the ref string. */
  save(projectId: string, filename: string, stream: Readable): Promise<string>;
  /** Resolve a ref to an absolute filesystem path (dev only). */
  absolutePath(ref: string): string;
}

// ── Local filesystem implementation ───────────────────────────────────────────

export const localFsStorage: ObjectStorage = {
  async save(projectId: string, filename: string, stream: Readable): Promise<string> {
    const dir = join(STORAGE_ROOT, projectId);
    mkdirSync(dir, { recursive: true });
    const dest = join(dir, filename);
    await pipeline(stream, createWriteStream(dest));
    return `${projectId}/${filename}`;
  },

  absolutePath(ref: string): string {
    return join(STORAGE_ROOT, ref);
  },
};

// ── S3 stub (Milestone 6) ─────────────────────────────────────────────────────
// When OBJECT_STORAGE=s3, swap localFsStorage for an S3 implementation that
// implements the same ObjectStorage interface. The engine receives a pre-signed
// URL or a shared bucket path instead of a local filesystem ref.

export const storage: ObjectStorage = localFsStorage;
