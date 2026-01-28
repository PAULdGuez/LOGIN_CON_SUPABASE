import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack instead of turbopack for build
  experimental: {
    // Disable static generation for routes that use dynamic data
  },
  // Skip type checking during build (we do it separately)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
