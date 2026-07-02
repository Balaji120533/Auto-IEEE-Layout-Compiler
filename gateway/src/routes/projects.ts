import type { FastifyInstance } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { extname } from 'path';
import { projectStore } from '../services/project-store';
import { storage } from '../services/object-storage';
import { parseMarkdown } from '../services/markdown-parser';
import { engineClient } from '../services/engine-client';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
function mimeFromExt(filename: string): string | undefined {
  return MIME[extname(filename).toLowerCase()];
}

export async function projectRoutes(server: FastifyInstance) {
  // ── POST /projects ─────────────────────────────────────────────────────────
  server.post('/projects', async (_req, reply) => {
    const project = projectStore.create();
    return reply.status(201).send(project);
  });

  // ── GET /projects/:id ──────────────────────────────────────────────────────
  server.get<{ Params: { id: string } }>('/projects/:id', async (req, reply) => {
    const project = projectStore.get(req.params.id);
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    return project;
  });

  // ── PUT /projects/:id ──────────────────────────────────────────────────────
  server.put<{
    Params: { id: string };
    Body: { markdown?: string };
  }>('/projects/:id', async (req, reply) => {
    const project = projectStore.update(req.params.id, {
      markdown: req.body.markdown,
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    return project;
  });

  // ── POST /projects/:id/images ──────────────────────────────────────────────
  server.post<{ Params: { id: string } }>('/projects/:id/images', async (req, reply) => {
    const project = projectStore.get(req.params.id);
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'No file in request' });

    // Sanitise filename: strip path separators
    const filename = data.filename.replace(/[/\\]/g, '_');
    const ref = await storage.save(project.id, filename, data.file);
    projectStore.addImageRef(project.id, ref);

    return reply.status(201).send({ ref, filename });
  });

  // ── GET /projects/:id/images/:filename ─────────────────────────────────────
  // Serves an uploaded image back so the frontend preview can display it.
  server.get<{ Params: { id: string; filename: string } }>(
    '/projects/:id/images/:filename',
    async (req, reply) => {
      // Guard against path traversal in the filename segment.
      const filename = req.params.filename.replace(/[/\\]/g, '_');
      const ref = `${req.params.id}/${filename}`;
      const abs = storage.absolutePath(ref);
      if (!existsSync(abs)) return reply.status(404).send({ error: 'Image not found' });

      const type = mimeFromExt(filename);
      if (type) reply.header('Content-Type', type);
      return reply.send(createReadStream(abs));
    },
  );

  // ── POST /projects/:id/compile ─────────────────────────────────────────────
  server.post<{
    Params: { id: string };
    Body?: { compile_options?: { page_size?: string; math_backend?: string } };
  }>('/projects/:id/compile', async (req, reply) => {
    const project = projectStore.get(req.params.id);
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    if (!project.markdown || !project.markdown.trim()) {
      return reply.status(422).send({ error: 'Project has no markdown content. PUT /projects/:id first.' });
    }

    // Parse Markdown → DocumentModel
    let model;
    try {
      model = parseMarkdown(project.markdown);
    } catch (err: any) {
      return reply.status(422).send({ error: `Markdown parse error: ${err.message}` });
    }

    // Apply any overrides from the request body
    const opts = req.body?.compile_options;
    if (opts?.page_size === 'letter') model.compile_options.page_size = 'letter';
    if (opts?.math_backend) {
      model.compile_options.math_backend = opts.math_backend as 'matplotlib' | 'katex' | 'omml';
    }

    // Submit to engine
    let jobId: string;
    try {
      ({ jobId } = await engineClient.compile(model));
    } catch (err: any) {
      return reply.status(502).send({ error: `Engine error: ${err.message}` });
    }

    return reply.status(202).send({ jobId, projectId: project.id });
  });

  // ── POST /projects/:id/compile-model ──────────────────────────────────────
  // Accepts a fully-formed DocumentModel from the frontend form editor.
  // Skips Markdown parsing entirely — the frontend builds the model directly.
  server.post<{
    Params: { id: string };
    Body: { model: Record<string, unknown> };
  }>('/projects/:id/compile-model', async (req, reply) => {
    const project = projectStore.get(req.params.id);
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    if (!req.body?.model) {
      return reply.status(422).send({ error: 'Missing model in request body' });
    }

    let jobId: string;
    try {
      ({ jobId } = await engineClient.compile(req.body.model as any));
    } catch (err: any) {
      return reply.status(502).send({ error: `Engine error: ${err.message}` });
    }

    return reply.status(202).send({ jobId, projectId: project.id });
  });
}
