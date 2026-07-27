import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    loader: 'custom',
    loaderFile: './lib/supabase-image-loader.ts',
  },
  allowedDevOrigins: ['kanojostudio.io'],
};

export default nextConfig;
