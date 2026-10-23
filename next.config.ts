import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Extract production domain from NEXT_PUBLIC_SITE_URL for Server Actions
const getProductionDomain = (): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return 'babakhorram.com';
  try {
    const parsed = new URL(siteUrl.includes('://') ? siteUrl : `https://${siteUrl}`);
    return parsed.host;
  } catch {
    return 'babakhorram.com';
  }
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
        ? [...devOrigins, getProductionDomain()]
        : [getProductionDomain()],
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

