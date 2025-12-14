import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Configure images to allow Jamendo CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.jamendo.com',
      },
      {
        protocol: 'https',
        hostname: 'usercontent.jamendo.com',
      },
      {
        protocol: 'https',
        hostname: 'imgjamendo.com',
      },
    ],
  },

  // Note: Removed COEP/COOP headers as they block external resources like Jamendo audio
};

export default nextConfig;
