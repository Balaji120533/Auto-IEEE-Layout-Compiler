/**
 * Lightweight, dependency-free image DPI/dimension check — run synchronously
 * right after a figure upload so the warning can be shown immediately, instead
 * of waiting until compile (engine/preflight/checks.py runs the equivalent
 * check, but only against the full document at compile time). Reads just the
 * PNG pHYs chunk / JPEG JFIF-APP0 (or EXIF) resolution field directly from the
 * file bytes — no image library needed for that.
 */
import { readFile } from 'fs/promises';

const MIN_DPI = 150; // matches engine/preflight/checks.py MIN_DPI

export interface ImageWarning {
  level: 'warn' | 'error';
  filename: string;
  message: string;
}

interface Dpi {
  x: number;
  y: number;
}

function readPngDpi(buf: Buffer): Dpi | null {
  // PNG: 8-byte signature, then a sequence of length(4)+type(4)+data+crc(4) chunks.
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    if (type === 'pHYs' && dataStart + 9 <= buf.length) {
      const ppuX = buf.readUInt32BE(dataStart);
      const ppuY = buf.readUInt32BE(dataStart + 4);
      const unit = buf.readUInt8(dataStart + 8);
      if (unit === 1) {
        // pixels per meter -> DPI (1 inch = 0.0254 m)
        return { x: Math.round(ppuX * 0.0254), y: Math.round(ppuY * 0.0254) };
      }
      return null; // unit 0 = unknown aspect ratio only, no absolute DPI
    }
    if (type === 'IDAT' || type === 'IEND') break; // pHYs (if present) precedes IDAT
    offset = dataStart + length + 4; // skip data + CRC
  }
  return null;
}

function readJpegDpi(buf: Buffer): Dpi | null {
  // JPEG: sequence of markers (0xFF, marker byte, length(2), data...).
  let offset = 2; // skip SOI (0xFFD8)
  while (offset + 4 <= buf.length) {
    if (buf.readUInt8(offset) !== 0xff) break;
    const marker = buf.readUInt8(offset + 1);
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break; // start of scan / EOI — no more metadata
    const segLength = buf.readUInt16BE(offset + 2);
    if (marker === 0xe0 && segLength >= 14) {
      // APP0 (JFIF): "JFIF\0" + version(2) + units(1) + xDensity(2) + yDensity(2)
      const identStart = offset + 4;
      const ident = buf.toString('ascii', identStart, identStart + 5);
      if (ident === 'JFIF\0') {
        const units = buf.readUInt8(identStart + 7);
        const xDensity = buf.readUInt16BE(identStart + 8);
        const yDensity = buf.readUInt16BE(identStart + 10);
        if (units === 1) return { x: xDensity, y: yDensity }; // dots per inch
        if (units === 2) return { x: Math.round(xDensity * 2.54), y: Math.round(yDensity * 2.54) }; // dots per cm
        return null; // units 0 = aspect ratio only
      }
    }
    offset += 2 + segLength;
  }
  return null;
}

function detectDpi(buf: Buffer): Dpi | null {
  if (buf.length >= 8 && buf.readUInt32BE(0) === 0x89504e47) return readPngDpi(buf);
  if (buf.length >= 2 && buf.readUInt16BE(0) === 0xffd8) return readJpegDpi(buf);
  return null; // GIF/WebP/SVG carry no reliable print-DPI metadata — skip silently
}

/** Check a single just-uploaded image file for the same DPI concerns the
 * engine's compile-time preflight enforces, so the user sees the warning
 * immediately instead of only after a full compile. */
export async function checkImageDpi(absPath: string, filename: string): Promise<ImageWarning | null> {
  try {
    const buf = await readFile(absPath);
    const dpi = detectDpi(buf);
    if (!dpi) return null; // no DPI metadata present — nothing to warn about here
    if (Math.min(dpi.x, dpi.y) < MIN_DPI) {
      return {
        level: 'warn',
        filename,
        message: `Low DPI (${dpi.x}×${dpi.y}); ≥300 recommended for print.`,
      };
    }
    return null;
  } catch {
    return null; // best-effort — never block the upload on a check failure
  }
}
