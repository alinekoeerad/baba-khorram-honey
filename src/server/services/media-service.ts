/**
 * Media Processing & Storage Service (Phase 3, Task 2)
 * Handles:
 * - Magic byte inspection (rejecting spoofed/unsupported formats)
 * - Dimension bounds validation (max 6000px) & size limit (max 10MB)
 * - Metadata stripping & EXIF auto-rotation
 * - Responsive WebP variant generation (480, 768, 1200, 1920; never upscaled)
 * - 16px blur placeholder generation
 * - MediaAsset database record persistence
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { db, MediaAssetRecord } from '@/server/db/client';
import { getStorageProvider } from '@/server/storage/storage-provider';
import { uiStringsFa } from '@/content/ui-strings.fa';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DIMENSION_PX = 6000;
export const BREAKPOINTS = [480, 768, 1200, 1920];

export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export interface ImageValidationResult {
  isValid: boolean;
  mime?: SupportedImageMime;
  error?: string;
}

export interface ImageVariantInfo {
  key: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
}

export interface ProcessedImageResult {
  width: number;
  height: number;
  masterKey: string;
  bytes: number;
  variants: Record<string, ImageVariantInfo>;
  blurDataUrl: string;
}

/**
 * Validates magic byte signatures to prevent spoofed/malicious uploads.
 * Allowed: JPEG (FF D8 FF), PNG (89 50 4E 47 ...), WebP (RIFF....WEBP).
 */
export function validateImageMagicBytes(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: uiStringsFa.adminMedia.invalidFileType };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mime: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mime: 'image/png' };
  }

  // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  const isRiff = buffer.slice(0, 4).toString('ascii') === 'RIFF';
  const isWebp = buffer.slice(8, 12).toString('ascii') === 'WEBP';
  if (isRiff && isWebp) {
    return { isValid: true, mime: 'image/webp' };
  }

  // 4. AVIF: bytes 4-7 are 'ftyp' and followed by 'avif' or 'avis'
  if (buffer.length >= 12 && buffer.slice(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.slice(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') {
      return { isValid: true, mime: 'image/avif' };
    }
  }

  // Non-matching (spoofed file or disallowed format e.g. SVG, EXE, TXT)
  return { isValid: false, error: uiStringsFa.adminMedia.fileSpoofed };
}

/**
 * Safely deletes physical image files and variants from both uploads/ and public/uploads/.
 * Strictly prevents path traversal and only touches files in the uploads directories.
 */
export async function deletePhysicalImageFile(
  filePathOrKey?: string | null,
  variants?: any
): Promise<void> {
  if (!filePathOrKey || typeof filePathOrKey !== 'string') return;

  const storage = getStorageProvider();
  // Strip leading slashes and leading uploads/
  const cleanKey = filePathOrKey.trim().replace(/^\/+/, '').replace(/^uploads\//, '');
  if (!cleanKey) return;

  const baseName = path.basename(cleanKey);
  const relativeSubdir = path.dirname(cleanKey); // e.g. '.' or 'recipes'

  const targetRoots = [
    path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
    path.join(process.cwd(), 'public', 'uploads'),
  ];

  for (const root of targetRoots) {
    try {
      const fullPath =
        relativeSubdir && relativeSubdir !== '.'
          ? path.resolve(root, relativeSubdir, baseName)
          : path.resolve(root, baseName);

      if (fullPath.startsWith(root) && fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          await fs.promises.unlink(fullPath);
        }
      }
    } catch {
      // Ignore non-fatal unlink errors
    }
  }

  // Also notify storage provider if key matches
  try {
    await storage.delete(baseName);
  } catch {}

  // Clean up variants if supplied
  if (variants && typeof variants === 'object') {
    const variantList = Array.isArray(variants) ? variants : Object.values(variants);
    for (const v of variantList as any[]) {
      const vKey = v?.key || (typeof v === 'string' ? v : null);
      if (vKey && typeof vKey === 'string') {
        const cleanVKey = vKey.trim().replace(/^\/+/, '').replace(/^uploads\//, '');
        const vBaseName = path.basename(cleanVKey);
        const vSubdir = path.dirname(cleanVKey);

        for (const root of targetRoots) {
          try {
            const vFullPath =
              vSubdir && vSubdir !== '.'
                ? path.resolve(root, vSubdir, vBaseName)
                : path.resolve(root, vBaseName);

            if (vFullPath.startsWith(root) && fs.existsSync(vFullPath)) {
              const stat = fs.statSync(vFullPath);
              if (stat.isFile()) {
                await fs.promises.unlink(vFullPath);
              }
            }
          } catch {}
        }

        try {
          await storage.delete(vBaseName);
        } catch {}
      }
    }
  }
}

/**
 * Processes image buffer: auto-rotates, strips metadata, validates dimensions,
 * generates responsive WebP variants, and creates blur placeholder.
 * Guarantees unique timestamped filenames to bust Next.js & browser caches.
 */
export async function processImage(
  buffer: Buffer,
  filePrefix: string
): Promise<ProcessedImageResult> {
  const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Ensure filePrefix has unique timestamp to bust browser & Next.js cache
  let uniquePrefix = filePrefix;
  if (!/[-_]\d{10,}/.test(uniquePrefix)) {
    uniquePrefix = `${uniquePrefix}-${Date.now()}`;
  }

  // Try primary engine: native sharp
  try {
    const sharpMod = await import('sharp');
    const sharp = sharpMod.default || sharpMod;

    const metadata = await sharp(buffer).rotate().metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    if (origWidth > MAX_DIMENSION_PX || origHeight > MAX_DIMENSION_PX) {
      throw new Error(uiStringsFa.adminMedia.dimensionTooLarge);
    }

    // Determine target widths (never upscale)
    const targetWidths = BREAKPOINTS.filter((w) => w < origWidth);
    if (!targetWidths.includes(origWidth)) {
      targetWidths.push(origWidth);
    }
    targetWidths.sort((a, b) => a - b);

    const variants: Record<string, ImageVariantInfo> = {};

    for (const w of targetWidths) {
      const outFilename = `${uniquePrefix}-${w}.webp`;
      const outPath = path.join(uploadDir, outFilename);

      const variantBuffer = await sharp(buffer)
        .rotate()
        .resize(w, null, { withoutEnlargement: true })
        .webp({ quality: 84, effort: 4, alphaQuality: 90 })
        .toBuffer();

      await fs.promises.writeFile(outPath, variantBuffer);

      // Also ensure mirrors in public/uploads for direct Next.js static asset resolution
      const publicUploadPath = path.join(process.cwd(), 'public', 'uploads', outFilename);
      try {
        const publicUploadDir = path.dirname(publicUploadPath);
        if (!fs.existsSync(publicUploadDir)) {
          fs.mkdirSync(publicUploadDir, { recursive: true });
        }
        await fs.promises.writeFile(publicUploadPath, variantBuffer);
      } catch {}

      const variantMeta = await sharp(variantBuffer).metadata();

      variants[String(w)] = {
        key: outFilename,
        url: `/uploads/${encodeURIComponent(outFilename)}`,
        width: w,
        height: variantMeta.height || Math.round((origHeight * w) / origWidth),
        bytes: variantBuffer.length,
      };
    }

    // Generate 16px blur placeholder
    const blurBuffer = await sharp(buffer)
      .rotate()
      .resize(16, null, { withoutEnlargement: true })
      .webp({ quality: 30, effort: 4, alphaQuality: 90 })
      .toBuffer();

    const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;
    const masterKey = `${uniquePrefix}-${origWidth}.webp`;

    return {
      width: origWidth,
      height: origHeight,
      masterKey,
      bytes: variants[String(origWidth)].bytes,
      variants,
      blurDataUrl,
    };
  } catch (sharpError: any) {
    if (sharpError.message === uiStringsFa.adminMedia.dimensionTooLarge) {
      throw sharpError;
    }

    // Fallback engine: Python Pillow script
    const tempInput = path.join(os.tmpdir(), `temp-${uniquePrefix}.raw`);
    await fs.promises.writeFile(tempInput, buffer);

    try {
      const scriptPath = path.resolve(process.cwd(), 'scripts/process-image.py');
      const proc = spawnSync('python3', [scriptPath, tempInput, uploadDir, uniquePrefix], {
        encoding: 'utf8',
      });

      if (proc.status !== 0 || !proc.stdout) {
        throw new Error(proc.stderr || 'Image processing failed');
      }

      const res = JSON.parse(proc.stdout.trim());
      if (res.error === 'DIMENSION_TOO_LARGE') {
        throw new Error(uiStringsFa.adminMedia.dimensionTooLarge);
      }
      if (res.error) {
        throw new Error(res.error);
      }

      return res;
    } finally {
      if (fs.existsSync(tempInput)) {
        await fs.promises.unlink(tempInput).catch(() => {});
      }
    }
  }
}

/**
 * End-to-end media upload pipeline:
 * 1. Validates size & magic bytes
 * 2. Generates unique, descriptive filename with Date.now() timestamp & short hash
 * 3. Processes image into responsive WebP variants
 * 4. Saves MediaAsset record to database with unique cache-busted storageKey & URL
 */
export async function uploadAndProcessMedia(params: {
  buffer: Buffer;
  filename?: string;
  alt?: string;
  createdById?: string;
}): Promise<MediaAssetRecord> {
  const { buffer, alt, createdById, filename } = params;

  // 1. File size check
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(uiStringsFa.adminMedia.fileTooLarge);
  }

  // 2. Magic byte validation
  const validation = validateImageMagicBytes(buffer);
  if (!validation.isValid) {
    throw new Error(validation.error || uiStringsFa.adminMedia.fileSpoofed);
  }

  // 3. Formulate clean base name and unique cache-busting timestamp + hash
  let baseName = 'img';
  if (filename) {
    const parsed = path.parse(filename).name;
    // Strip previous timestamps / hashes if present
    const stripped = parsed.replace(/[-_]\d{10,}(?:[-_][a-f0-9]+)?$/i, '');
    const sanitized = stripped.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_').toLowerCase().trim();
    if (sanitized && sanitized !== '_') {
      baseName = sanitized;
    }
  }

  const timestamp = Date.now();
  const shortHash = crypto.randomBytes(3).toString('hex');
  const filePrefix = `${baseName}-${timestamp}-${shortHash}`;

  // 4. Process into WebP variants
  const processed = await processImage(buffer, filePrefix);

  // 5. Persist MediaAsset in database
  const asset = await db.mediaAsset.create({
    data: {
      storageKey: processed.masterKey,
      mime: 'image/webp',
      bytes: processed.bytes,
      width: processed.width,
      height: processed.height,
      blurDataUrl: processed.blurDataUrl,
      variants: processed.variants,
      alt: alt?.trim() || null,
      createdById: createdById || null,
    },
  });

  return {
    ...asset,
    url: `/uploads/${encodeURIComponent(processed.masterKey)}`,
  };
}

/**
 * Safely deletes a media asset record and its associated physical files from storage.
 */
export async function deleteMediaAsset(assetId: string): Promise<void> {
  const asset = await db.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new Error('تصویر یافت نشد.');
  }

  await deletePhysicalImageFile(asset.storageKey, asset.variants);

  await db.mediaAsset.delete({ where: { id: assetId } });
}
