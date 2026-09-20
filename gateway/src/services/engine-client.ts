import type { DocumentModel } from '../types/document-model';
import { STORAGE_ROOT, storage } from './object-storage';

const ENGINE_URL = process.env.ENGINE_URL ?? 'http://localhost:8000';
const usingCloudStorage = () =>
  process.env.OBJECT_STORAGE === 'r2' || process.env.OBJECT_STORAGE === 'cloudinary';

export interface PreflightWarning {
  level: string;
  anchor: string;
  message: string;
}

export interface JobStatus {
  id: string;
  status: string;
  messages: string[];
  artifacts: Record<string, string>;
  warnings: PreflightWarning[];
  error?: string;
}

export interface CompileFormats {
  docx?: boolean;
  pdf?: boolean;
}

/**
 * Cloud backends (R2, Cloudinary, ...) each build URLs differently — R2's is
 * a plain baseURL+key join, Cloudinary's embeds cloud/config into the path via
 * its own builder — so there's no single "storage_base" prefix the engine can
 * string-concatenate against every backend. Instead, resolve each figure's
 * image_ref to its full URL here, in the one place that already knows which
 * backend is active, and hand the engine plain URLs it just downloads as-is.
 */
function resolveImageUrls(model: DocumentModel): DocumentModel {
  if (!usingCloudStorage()) return model;
  return {
    ...model,
    blocks: model.blocks.map(block =>
      block.type === 'figure' || block.type === 'wide_figure'
        ? { ...block, image_ref: storage.url(block.image_ref) }
        : block,
    ),
  };
}

export const engineClient = {
  async compile(model: DocumentModel, formats?: CompileFormats): Promise<{ jobId: string }> {
    const res = await fetch(`${ENGINE_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: resolveImageUrls(model),
        // Local dev only: the engine reads files directly off this path,
        // which only works when gateway and engine share a filesystem. Cloud
        // storage sends full image URLs in image_ref instead (see above) and
        // ignores storage_base entirely.
        storage_base: usingCloudStorage() ? null : STORAGE_ROOT,
        image_refs_are_urls: usingCloudStorage(),
        // Default: docx always on, pdf off — matches the "confirm docx first,
        // then spend a PDF conversion credit" workflow the UI offers.
        want_docx: formats?.docx ?? true,
        want_pdf: formats?.pdf ?? false,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Engine /compile failed ${res.status}: ${text}`);
    }
    const data = (await res.json()) as { job_id: string; status: string };
    return { jobId: data.job_id };
  },

  async getStatus(jobId: string): Promise<JobStatus> {
    const res = await fetch(`${ENGINE_URL}/jobs/${jobId}/status`);
    if (!res.ok) throw new Error(`Engine job status ${res.status}`);
    return res.json() as Promise<JobStatus>;
  },

  engineUrl(): string {
    return ENGINE_URL;
  },
};
