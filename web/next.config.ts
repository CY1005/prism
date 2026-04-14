import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["108.187.32.122"],
  serverExternalPackages: ["postgres"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
