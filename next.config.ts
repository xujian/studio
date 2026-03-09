import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // In dev, Supabase resolves to a private IP (VPN/local DNS), which Next.js
    // blocks for SSRF protection. Skip optimization in dev — images load
    // directly from Supabase. Production works normally with sharp.
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rhxlulctluazrpqzooya.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
