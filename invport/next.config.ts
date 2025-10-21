import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable static export for Azure Static Web Apps
  output: 'export',
  trailingSlash: true,
  // Set the workspace root to silence the multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname, '..'),
  
  // Disable caching for static export (not needed)
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
  
  // Enable build caching
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
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
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Webpack configuration (for production builds)
  webpack: (config, { isServer, dev }) => {
    // Enable build caching for faster rebuilds
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
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

