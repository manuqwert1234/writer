import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  reactCompiler: false, // Disabled to improve compilation performance
  
  // Fix for multiple lockfiles warning (Vercel deployment)
  outputFileTracingRoot: __dirname,

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

export default withPWA(nextConfig);
