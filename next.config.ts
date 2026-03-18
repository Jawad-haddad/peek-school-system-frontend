import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Only apply rewrites in dev OR if no explicit base URL is provided
    const isDev = process.env.NODE_ENV !== 'production';
    const hasBaseUrl = !!process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!isDev && hasBaseUrl) {
      return []; // Return empty array to disable rewrites in production
    }

    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:3000/health',
      },
    ];
  },
  output: 'standalone',
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
