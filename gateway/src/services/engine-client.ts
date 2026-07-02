import type { DocumentModel } from '../types/document-model';
import { STORAGE_ROOT } from './object-storage';

const ENGINE_URL = process.env.ENGINE_URL ?? 'http://localhost:8000';

export interface JobStatus {
  id: string;
  status: string;
  messages: string[];
  artifacts: Record<string, string>;
  error?: string;
}

export const engineClient = {
  async compile(model: DocumentModel): Promise<{ jobId: string }> {
    const res = await fetch(`${ENGINE_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: model,
        storage_base: STORAGE_ROOT,
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
