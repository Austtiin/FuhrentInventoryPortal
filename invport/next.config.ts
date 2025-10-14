import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Static export for Azure Static Web Apps
  output: 'export',
  trailingSlash: true,
  // Set the workspace root to silence the multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname, '..'),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

