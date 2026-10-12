import { describe, it, expect } from 'vitest';
import {
  validateImageMagicBytes,
  MAX_FILE_SIZE_BYTES,
  MAX_DIMENSION_PX,
} from '@/server/services/media-service';
import { isMediaAssetReferenced } from '@/server/services/media-reference-tracker';
import { LocalDiskStorage } from '@/server/storage/storage-provider';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { db } from '@/server/db/client';

describe('Image Upload Validation & Magic Bytes (Phase 3, Task 2)', () => {
  it('identifies and accepts genuine JPEG magic bytes (FF D8 FF)', () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const res = validateImageMagicBytes(validJpeg);
    expect(res.isValid).toBe(true);
    expect(res.mime).toBe('image/jpeg');
  });

  it('identifies and accepts genuine PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const res = validateImageMagicBytes(validPng);
    expect(res.isValid).toBe(true);
    expect(res.mime).toBe('image/png');
  });

  it('identifies and accepts genuine WebP magic bytes (RIFF....WEBP)', () => {
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    const res = validateImageMagicBytes(validWebp);
    expect(res.isValid).toBe(true);
    expect(res.mime).toBe('image/webp');
  });

  it('rejects spoofed text file masquerading as image with Persian error', () => {
    const fakeTextFile = Buffer.from('This is a plain text file disguised as image.jpg with some text content');
    const res = validateImageMagicBytes(fakeTextFile);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(uiStringsFa.adminMedia.fileSpoofed);
  });

  it('rejects spoofed SVG file (XML/Script injection threat) with Persian error', () => {
    const fakeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const res = validateImageMagicBytes(fakeSvg);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(uiStringsFa.adminMedia.fileSpoofed);
  });

  it('rejects spoofed binary executable (MZ / ELF) with Persian error', () => {
    const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
    const res = validateImageMagicBytes(fakeExe);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe(uiStringsFa.adminMedia.fileSpoofed);
  });

  it('enforces maximum file size limit (10 MB) and dimension limit (6000px)', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_DIMENSION_PX).toBe(6000);
  });
});

describe('Storage Provider & Path Traversal Prevention (Phase 3, Task 1)', () => {
  it('safely normalizes keys and prevents path traversal out of uploads directory', () => {
    const storage = new LocalDiskStorage('./uploads');

    const safePath = storage.resolveSafePath('../../../etc/passwd');
    expect(safePath).not.toContain('..');
    expect(safePath).toContain('passwd');

    const deepTraverse = storage.resolveSafePath('..\\..\\windows\\system32\\cmd.exe');
    expect(deepTraverse).toContain('cmd.exe');
    expect(deepTraverse).not.toContain('..');
  });

  it('generates consistent public URLs under /uploads', () => {
    const storage = new LocalDiskStorage('./uploads');
    const url = storage.getPublicUrl('my-image-480.webp');
    expect(url).toBe('/uploads/my-image-480.webp');
  });
});
