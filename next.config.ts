import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Extract production domains from SITE_URL and NEXT_PUBLIC_SITE_URL for Server Actions
const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>();
  origins.add('babakhorram.com');
  origins.add('www.babakhorram.com');
  origins.add('localhost:3000');
  origins.add('127.0.0.1:3000');

  const envUrls = [process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL];
  for (const urlStr of envUrls) {
    if (!urlStr) continue;
    try {
      const parsed = new URL(urlStr.includes('://') ? urlStr : `https://${urlStr}`);
      origins.add(parsed.host);
      if (parsed.hostname.startsWith('www.')) {
        origins.add(parsed.hostname.replace(/^www\./, ''));
      } else if (!parsed.hostname.includes('localhost') && !parsed.hostname.startsWith('127.')) {
        origins.add(`www.${parsed.hostname}`);
      }
    } catch {
      // Ignore invalid URL
    }
  }

  return Array.from(origins);
};

const devOrigins = [
  'localhost:3000',
  '192.168.*.*',
  '10.*.*.*',
  '172.*.*.*',
  '*.trycloudflare.com',
  '*.ngrok-free.app',
];

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/adapter-pg', 'pg'],
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: devOrigins,
  experimental: {
    agentUpgrade: 'security',
    serverActions: {
      bodySizeLimit: '25mb',
      allowedOrigins: isDev
        ? [...devOrigins, ...getAllowedOrigins()]
        : getAllowedOrigins(),
    },
  },
  typescript: {
    // TypeScript check is run via pnpm typecheck
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.openstreetmap.org https://*.google.com https://*.gstatic.com https://*.googleapis.com https://*.basemaps.cartocdn.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.tile.openstreetmap.org https://*.openstreetmap.org https://maps.google.com https://*.googleapis.com",
      "frame-src 'self' https://www.openstreetmap.org https://maps.google.com https://*.google.com https://*.google.ir https://*.googleapis.com",
      "child-src 'self' https://www.openstreetmap.org https://maps.google.com https://*.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: csp },
      ...(isDev
        ? []
        : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

