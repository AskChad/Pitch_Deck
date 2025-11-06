import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit for file uploads
    // Note: Large files (up to 1GB) are now uploaded to Supabase Storage directly
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
