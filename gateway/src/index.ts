import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { healthRoutes } from './routes/health';
import { projectRoutes } from './routes/projects';
import { jobRoutes } from './routes/jobs';

const server = Fastify({ logger: { level: 'info' } });

const PORT = Number(process.env.PORT ?? 3001);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

async function start() {
  await server.register(cors, { origin: FRONTEND_URL });
  await server.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB
  await server.register(healthRoutes);
  await server.register(projectRoutes);
  await server.register(jobRoutes);

  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
