import type { FastifyInstance } from 'fastify';
import {
  convertDocxStreamToPdfBuffer,
  PdfServiceLimitError,
  PdfConversionError,
} from '../services/pdf-conversion';

// ── POST /convert/docx-to-pdf ───────────────────────────────────────────────
// Accepts a multipart-uploaded .docx file, converts it via Adobe PDF Services,
// and streams the resulting PDF back as a download. Runs entirely server-side;
// Adobe credentials never leave the gateway process.
export async function pdfConvertRoutes(server: FastifyInstance) {
  server.post('/convert/docx-to-pdf', async (req, reply) => {
    const file = await req.file();

    if (!file) {
      return reply.status(400).send({ error: 'No file uploaded. Expected a multipart field containing a .docx file.' });
    }

    const isDocx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.filename?.toLowerCase().endsWith('.docx');

    if (!isDocx) {
      return reply.status(400).send({ error: 'Uploaded file must be a .docx document.' });
    }

    try {
      const pdfBuffer = await convertDocxStreamToPdfBuffer(file.file);

      const downloadName = file.filename.replace(/\.docx$/i, '.pdf');
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${downloadName}"`);
      return reply.send(pdfBuffer);
    } catch (err) {
      if (err instanceof PdfServiceLimitError) {
        req.log.warn({ err }, 'Adobe PDF Services usage limit reached');
        return reply.status(429).send({ error: err.message });
      }
      if (err instanceof PdfConversionError) {
        req.log.error({ err }, 'PDF conversion failed');
        return reply.status(502).send({ error: err.message });
      }
      req.log.error({ err }, 'Unexpected error during PDF conversion');
      return reply.status(500).send({ error: 'Unexpected error during PDF conversion.' });
    }
  });
}
