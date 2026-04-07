import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: Disable X-Powered-By header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Strict mode for better error detection
  reactStrictMode: true,
  
  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
    ];
  },
  
  // Optimize images (if using next/image)
  images: {
    domains: [], // Add allowed image domains here
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
