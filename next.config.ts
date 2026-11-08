import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Extract production domains from SITE_URL and NEXT_PUBLIC_SITE_URL for Server Actions
const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>();
  origins.add('babakhorram.com');
  origins.add('www.babakhorram.com');

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
    return [
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

