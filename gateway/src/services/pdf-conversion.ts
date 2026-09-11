import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';
import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  CreatePDFJob,
  CreatePDFResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError,
} from '@adobe/pdfservices-node-sdk';

// ── Errors ───────────────────────────────────────────────────────────────────

export class PdfConversionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PdfConversionError';
  }
}

export class PdfServiceLimitError extends PdfConversionError {
  constructor(cause?: unknown) {
    super(
      'Adobe PDF Services free-tier limit reached (500 document transactions/month). ' +
        'Try again next month or upgrade the Adobe plan.',
      cause,
    );
    this.name = 'PdfServiceLimitError';
  }
}

// ── Credentials ──────────────────────────────────────────────────────────────
// Read only from environment variables — never hardcoded, never sent to the frontend.

function loadCredentials() {
  const clientId = process.env.PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.PDF_SERVICES_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new PdfConversionError(
      'Missing PDF_SERVICES_CLIENT_ID / PDF_SERVICES_CLIENT_SECRET environment variables.',
    );
  }

  return new ServicePrincipalCredentials({ clientId, clientSecret });
}

// ── Conversion ───────────────────────────────────────────────────────────────

/**
 * Converts a .docx file to PDF via Adobe PDF Services.
 * Accepts either a filesystem path or a readable stream of the source .docx.
 * Returns the absolute path of the converted PDF (caller is responsible for
 * reading/streaming it onward and for eventually deleting it, or use
 * convertDocxBufferToPdf which cleans up automatically).
 */
export async function convertDocxToPdf(sourcePath: string): Promise<string> {
  const credentials = loadCredentials();
  const pdfServices = new PDFServices({ credentials });

  let readStream;
  try {
    readStream = createReadStream(sourcePath);

    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.DOCX,
    });

    const job = new CreatePDFJob({ inputAsset });
    const pollingURL = await pdfServices.submit({ job });
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: CreatePDFResult,
    });

    if (!pdfServicesResponse.result) {
      throw new PdfConversionError('Adobe PDF Services returned an empty result for the conversion job.');
    }
    const resultAsset = pdfServicesResponse.result.asset;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    const outputPath = join(tmpdir(), `adobe-pdf-${randomUUID()}.pdf`);
    await pipeline(streamAsset.readStream as Readable, createWriteStream(outputPath));

    return outputPath;
  } catch (err) {
    throw translateAdobeError(err);
  }
}

/**
 * Convenience wrapper: takes an uploaded file stream, writes it to a temp
 * .docx, converts it, reads the resulting PDF into a Buffer, and always
 * cleans up both temp files — regardless of success or failure.
 */
export async function convertDocxStreamToPdfBuffer(docxStream: Readable): Promise<Buffer> {
  const tempDocxPath = join(tmpdir(), `upload-${randomUUID()}.docx`);
  let tempPdfPath: string | undefined;

  try {
    await pipeline(docxStream, createWriteStream(tempDocxPath));
    tempPdfPath = await convertDocxToPdf(tempDocxPath);
    return await fs.readFile(tempPdfPath);
  } finally {
    await cleanupFile(tempDocxPath);
    if (tempPdfPath) await cleanupFile(tempPdfPath);
  }
}

async function cleanupFile(path: string): Promise<void> {
  try {
    await fs.unlink(path);
  } catch {
    // Already removed or never created — nothing to do.
  }
}

// ── Error translation ────────────────────────────────────────────────────────

function translateAdobeError(err: unknown): PdfConversionError {
  if (err instanceof ServiceUsageError) {
    return new PdfServiceLimitError(err);
  }
  if (err instanceof ServiceApiError) {
    return new PdfConversionError(`Adobe PDF Services API error: ${err.message}`, err);
  }
  if (err instanceof SDKError) {
    return new PdfConversionError(`Adobe PDF Services SDK error: ${err.message}`, err);
  }
  if (err instanceof PdfConversionError) {
    return err;
  }
  return new PdfConversionError(
    `Unexpected error during PDF conversion: ${err instanceof Error ? err.message : String(err)}`,
    err,
  );
}
