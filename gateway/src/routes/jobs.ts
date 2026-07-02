import type { FastifyInstance } from 'fastify';
import { engineClient } from '../services/engine-client';

export async function jobRoutes(server: FastifyInstance) {
  const ENGINE_URL = engineClient.engineUrl();

  // ── GET /jobs/:id/status ───────────────────────────────────────────────────
  server.get<{ Params: { id: string } }>('/jobs/:id/status', async (req, reply) => {
    try {
      const status = await engineClient.getStatus(req.params.id);
      return status;
    } catch {
      return reply.status(404).send({ error: 'Job not found' });
    }
  });

  // ── GET /jobs/:id/stream  (SSE proxy) ─────────────────────────────────────
  server.get<{ Params: { id: string } }>('/jobs/:id/stream', async (req, reply) => {
    const upstreamUrl = `${ENGINE_URL}/jobs/${req.params.id}/stream`;
    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, { headers: { Accept: 'text/event-stream' } });
    } catch {
      return reply.status(502).send({ error: 'Engine unreachable' });
    }
    if (!upstream.ok) {
      return reply.status(upstream.status).send({ error: 'Job not found' });
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    const reader = upstream.body!.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { reply.raw.end(); break; }
          reply.raw.write(Buffer.from(value));
        }
      } catch {
        reply.raw.end();
      }
    };
    pump();
    await new Promise<void>(resolve => reply.raw.on('close', resolve));
  });

  // ── GET /jobs/:id/artifacts/:filename ─────────────────────────────────────
  // Redirect to the engine so the browser streams the file directly.
  server.get<{ Params: { id: string; filename: string } }>(
    '/jobs/:id/artifacts/:filename',
    async (req, reply) => {
      return reply.redirect(
        `${ENGINE_URL}/jobs/${req.params.id}/artifacts/${req.params.filename}`,
      );
    },
  );
}
