import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Always enable static export so builds consistently produce 'out'
  output: 'export',
  trailingSlash: true,
  // Set the workspace root to silence the multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname, '..'),
  
  // Allow accessing the dev server from LAN devices (Next.js 16+)
  // This silences the cross-origin warning when opening via your machine's IP
  // Customize via env NEXT_ALLOWED_DEV_ORIGINS (comma-separated) if needed
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS
      ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://0.0.0.0:3000',
          'http://192.168.1.16:3000',
        ]) as unknown as any,
  }),
  
  // Always output to 'out' for Azure Static Web Apps
  distDir: 'out',
  
  // Remove invalid experimental staleTimes to avoid build warnings
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storageinventoryflatt.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
      // Keep previous host for backward compatibility if needed
      {
        protocol: 'https',
        hostname: 'flattstorage.blob.core.windows.net',
        port: '',
        pathname: '/**',
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

