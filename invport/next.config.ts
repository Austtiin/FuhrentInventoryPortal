import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Removed static export to enable server-side database functionality
  // output: 'export',
  trailingSlash: true,
  // Set the workspace root to silence the multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname, '..'),
  
  // DISABLE ALL CACHING - Force dynamic rendering
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flattstorage.blob.core.windows.net',
        port: '',
        pathname: '/invpics/**',
      },
    ],
  },
  // Exclude server-side packages from client bundle
  serverExternalPackages: ['mssql', '@azure/storage-blob'],
  
  // Turbopack configuration (for dev mode)
  turbopack: {
    resolveAlias: {
      // Turbopack alias configuration
      '@': './src',
    },
    resolveExtensions: [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
  },
  
  // Webpack configuration (for production builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dgram: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;