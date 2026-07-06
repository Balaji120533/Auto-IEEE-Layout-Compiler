const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:3001';

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  markdown?: string;
  imageRefs: string[];
}

export interface JobStatus {
  id: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  messages: string[];
  artifacts: Record<string, string>;
  error?: string;
}

export const api = {
  async createProject(): Promise<Project> {
    const r = await fetch(`${GATEWAY}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) throw new Error('Failed to create project');
    return r.json();
  },

  async getProject(id: string): Promise<Project> {
    const r = await fetch(`${GATEWAY}/projects/${id}`);
    if (!r.ok) throw new Error('Project not found');
    return r.json();
  },

  async saveMarkdown(id: string, markdown: string): Promise<Project> {
    const r = await fetch(`${GATEWAY}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown }),
    });
    if (!r.ok) throw new Error('Failed to save');
    return r.json();
  },

  async uploadImage(id: string, file: File): Promise<{ ref: string; filename: string }> {
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(`${GATEWAY}/projects/${id}/images`, { method: 'POST', body: form });
    if (!r.ok) {
      // Surface the status so callers can recover from a stale/missing project (404).
      const err = new Error(
        r.status === 404 ? 'Project not found' : `Upload failed (HTTP ${r.status})`,
      ) as Error & { status?: number };
      err.status = r.status;
      throw err;
    }
    return r.json();
  },

  async compile(id: string): Promise<{ jobId: string; projectId: string }> {
    const r = await fetch(`${GATEWAY}/projects/${id}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error((err as { error: string }).error ?? 'Compile failed');
    }
    return r.json();
  },

  async compileModel(id: string, model: unknown): Promise<{ jobId: string; projectId: string }> {
    const r = await fetch(`${GATEWAY}/projects/${id}/compile-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({ error: 'Unknown error' }));
      // Surface the status so callers can recover from a stale/missing project (404).
      const err = new Error((body as { error: string }).error ?? 'Compile failed') as Error & { status?: number };
      err.status = r.status;
      throw err;
    }
    return r.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const r = await fetch(`${GATEWAY}/jobs/${jobId}/status`);
    if (!r.ok) throw new Error('Job not found');
    return r.json();
  },

  jobStreamUrl(jobId: string): string {
    return `${GATEWAY}/jobs/${jobId}/stream`;
  },

  artifactUrl(jobId: string, filename: string): string {
    return `${GATEWAY}/jobs/${jobId}/artifacts/${filename}`;
  },

  /** URL to display an uploaded image (ref is "projectId/filename"). */
  imageUrl(ref: string): string {
    const slash = ref.indexOf('/');
    if (slash < 0) return '';
    const projectId = ref.slice(0, slash);
    const filename = ref.slice(slash + 1);
    return `${GATEWAY}/projects/${projectId}/images/${encodeURIComponent(filename)}`;
  },

  async checkHealth(): Promise<boolean> {
    try {
      const r = await fetch(`${GATEWAY}/health`, { signal: AbortSignal.timeout(2000) });
      return r.ok;
    } catch {
      return false;
    }
  },
};
