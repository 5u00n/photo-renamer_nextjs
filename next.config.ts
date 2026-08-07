import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use Pages Router (src/pages directory)
  // App Router is disabled — src/app has been removed

  // Enable strict TypeScript checking during builds
  // (ignoreBuildErrors was previously set to true — this was masking real bugs)
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
