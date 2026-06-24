import type { NextConfig } from "next";

const nextConfig = {
  allowedDevOrigins: ["172.21.240.1"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
} as any;

export default nextConfig as NextConfig;

