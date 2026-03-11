import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse uses dynamic file reads that confuse Turbopack/Webpack bundling.
  // Marking it as external lets Node.js resolve it from node_modules at runtime.
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
