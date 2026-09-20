import { createWriteStream, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';

// Root directory where project images are stored in dev (local FS).
export const STORAGE_ROOT = resolve(__dirname, '../../storage');

// ── Interface ─────────────────────────────────────────────────────────────────

export interface ObjectStorage {
  /** Save a file stream under projectId/filename; return the ref string. */
  save(projectId: string, filename: string, stream: Readable): Promise<string>;
  /** Read a stored object's full contents back into memory (e.g. for a DPI check). */
  read(ref: string): Promise<Buffer>;
  /** A URL the engine (a separate service/process) can fetch the object from. */
  url(ref: string): string;
  /** Whether the object exists (used to 404 the image-serving route cleanly). */
  exists(ref: string): Promise<boolean>;
}

function mimeFromExt(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const MIME: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return MIME[ext] ?? 'application/octet-stream';
}

// ── Local filesystem implementation ───────────────────────────────────────────
// Dev only: the engine reads these paths directly, which only works when
// gateway and engine share a filesystem (same machine). Do not use this in a
// multi-service deployment (e.g. Render) — see r2Storage below.

function localAbsolutePath(ref: string): string {
  return join(STORAGE_ROOT, ref);
}

export const localFsStorage: ObjectStorage = {
  async save(projectId: string, filename: string, stream: Readable): Promise<string> {
    const dir = join(STORAGE_ROOT, projectId);
    mkdirSync(dir, { recursive: true });
    const dest = join(dir, filename);
    await pipeline(stream, createWriteStream(dest));
    return `${projectId}/${filename}`;
  },

  async read(ref: string): Promise<Buffer> {
    return readFile(localAbsolutePath(ref));
  },

  url(ref: string): string {
    // In dev, the engine runs on the same machine and reads the file directly
    // via GATEWAY_STORAGE_ROOT rather than fetching this URL, but routes that
    // serve images to the browser (GET /projects/:id/images/:filename) don't
    // consult this — they stream from disk directly.
    return localAbsolutePath(ref);
  },

  async exists(ref: string): Promise<boolean> {
    try {
      await readFile(localAbsolutePath(ref));
      return true;
    } catch {
      return false;
    }
  },
};

// ── Cloudflare R2 implementation ──────────────────────────────────────────────
// R2 is S3-API-compatible, so the standard AWS SDK works against it by pointing
// `endpoint` at the account's R2 endpoint. Required on any host where the
// engine and gateway are separate services with separate filesystems (Render):
// the engine downloads images from the public R2.dev URL instead of reading a
// local path that only ever existed on the gateway's disk.

function createR2Storage(): ObjectStorage {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrlBase = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrlBase) {
    throw new Error(
      'R2 storage selected (OBJECT_STORAGE=r2) but one of R2_ACCOUNT_ID, ' +
        'R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL is missing.',
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const trimmedPublicUrl = publicUrlBase.replace(/\/+$/, '');

  return {
    async save(projectId: string, filename: string, stream: Readable): Promise<string> {
      const key = `${projectId}/${filename}`;
      // R2/S3 PutObject needs a known length or a buffered body for the SDK's
      // default (non-multipart) upload path — images from multipart form
      // uploads are small enough (capped at 20MB by the multipart plugin) that
      // buffering in memory is simpler and safe here.
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: mimeFromExt(filename),
        }),
      );
      return key;
    },

    async read(ref: string): Promise<Buffer> {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: ref }));
      const chunks: Buffer[] = [];
      for await (const chunk of res.Body as Readable) chunks.push(chunk as Buffer);
      return Buffer.concat(chunks);
    },

    url(ref: string): string {
      return `${trimmedPublicUrl}/${ref}`;
    },

    async exists(ref: string): Promise<boolean> {
      try {
        await client.send(new GetObjectCommand({ Bucket: bucket, Key: ref }));
        return true;
      } catch {
        return false;
      }
    },
  };
}

// ── Cloudinary implementation ──────────────────────────────────────────────────
// Free tier needs no card on file (unlike R2/S3), which is why this is the
// default cloud backend for this project. `public_id` doubles as our ref —
// Cloudinary treats "/" in it as a folder path, so "projectId/filename" (minus
// its extension, which Cloudinary manages itself) works directly. Uploaded
// assets are public by default, giving the engine a plain HTTPS URL to fetch.

function createCloudinaryStorage(): ObjectStorage {
  // Host dashboards (Render, etc.) can silently include a trailing newline or
  // space when a credential is pasted in — Cloudinary's HMAC signature check
  // then fails with "Invalid Signature" instead of a clearer auth error,
  // since a single stray whitespace character changes the signed string.
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary storage selected (OBJECT_STORAGE=cloudinary) but one of ' +
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET is missing.',
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  // Cloudinary strips/manages file extensions itself (they're a display/format
  // concern, not part of the identity) — strip it from the ref's public_id so
  // upload and lookup agree, then restore the original filename in url()/read()
  // callers via the ref, which keeps the extension for our own bookkeeping
  // (project store, DPI sniffing, MIME lookup).
  function publicIdForRef(ref: string): string {
    const dot = ref.lastIndexOf('.');
    return dot === -1 ? ref : ref.slice(0, dot);
  }

  function urlForRef(ref: string): string {
    return cloudinary.url(publicIdForRef(ref), { resource_type: 'image', secure: true });
  }

  return {
    async save(projectId: string, filename: string, stream: Readable): Promise<string> {
      const ref = `${projectId}/${filename}`;
      await new Promise<void>((resolvePromise, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { public_id: publicIdForRef(ref), resource_type: 'image', overwrite: true },
          (err) => (err ? reject(err) : resolvePromise()),
        );
        stream.pipe(uploadStream);
      });
      return ref;
    },

    async read(ref: string): Promise<Buffer> {
      const res = await fetch(urlForRef(ref));
      if (!res.ok) throw new Error(`Cloudinary object not found: ${ref}`);
      return Buffer.from(await res.arrayBuffer());
    },

    url: urlForRef,

    async exists(ref: string): Promise<boolean> {
      try {
        const res = await fetch(urlForRef(ref), { method: 'HEAD' });
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}

// ── Selection ──────────────────────────────────────────────────────────────────
// OBJECT_STORAGE=cloudinary (default cloud choice — free tier needs no card)
// or =r2 opt into a cloud backend, required whenever gateway and engine are
// separate services (e.g. Render); default stays local FS for the
// single-machine dev loop (`pnpm dev`).

function selectStorage(): ObjectStorage {
  switch (process.env.OBJECT_STORAGE) {
    case 'cloudinary':
      return createCloudinaryStorage();
    case 'r2':
      return createR2Storage();
    default:
      return localFsStorage;
  }
}

export const storage: ObjectStorage = selectStorage();
