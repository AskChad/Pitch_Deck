import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit for file uploads (50MB)
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Configure API route timeouts and limits
  serverRuntimeConfig: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
