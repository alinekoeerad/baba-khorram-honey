/**
 * Public Static Uploads Serving Handler (Phase 3, Task 3)
 * Serves optimized WebP media assets in development via Next.js
 * with immutable long-cache headers.
 *
 * In production (Phase 12), Nginx/Caddy proxies /uploads directly from disk:
 * location /uploads/ {
 *     alias /var/www/honey/uploads/;
 *     expires 1y;
 *     add_header Cache-Control "public, max-age=31536000, immutable";
 *     add_header X-Content-Type-Options "nosniff";
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LocalDiskStorage } from '@/server/storage/storage-provider';

const ALLOWED_IMAGE_MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.avif': 'image/avif',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (
      !pathSegments ||
      pathSegments.length === 0 ||
      pathSegments.some(
        (seg) =>
          !seg ||
          seg === '.' ||
          seg === '..' ||
          seg.startsWith('.') ||
          seg.includes('..') ||
          seg.includes('/') ||
          seg.includes('\\') ||
          seg.includes('\0')
      )
    ) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const requestedFilename = pathSegments.join('/');
    const ext = path.extname(requestedFilename).toLowerCase();
    const contentType = ALLOWED_IMAGE_MIME[ext];
    if (!contentType) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Prevent directory traversal
    const storage = new LocalDiskStorage();
    let filePath: string;
    try {
      filePath = storage.resolveSafePath(requestedFilename);
    } catch {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      // Fallback check against public/uploads (e.g. seeded assets or fallback storage)
      const publicUploadPath = path.resolve(process.cwd(), 'public', 'uploads', requestedFilename);
      const publicBase = path.resolve(process.cwd(), 'public', 'uploads');
      if (
        (publicUploadPath === publicBase || publicUploadPath.startsWith(publicBase + path.sep)) &&
        fs.existsSync(/*turbopackIgnore: true*/ publicUploadPath)
      ) {
        filePath = publicUploadPath;
      } else {
        return new NextResponse('File Not Found', { status: 404 });
      }
    }

    const fileBuffer = await fs.promises.readFile(/*turbopackIgnore: true*/ filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (err: any) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
