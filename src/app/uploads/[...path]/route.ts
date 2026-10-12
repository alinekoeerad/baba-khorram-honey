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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    const requestedFilename = pathSegments.join('/');

    // Prevent directory traversal
    const storage = new LocalDiskStorage();
    let filePath: string;
    try {
      filePath = storage.resolveSafePath(requestedFilename);
    } catch {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    // Determine MIME type
    let contentType = 'image/webp';
    if (requestedFilename.endsWith('.jpg') || requestedFilename.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (requestedFilename.endsWith('.png')) {
      contentType = 'image/png';
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
