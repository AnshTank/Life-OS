import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty config - we use App Router (app) exclusively
  // The views directory contains reusable view components, not routes
  // Force root to current directory to avoid multiple lockfiles warning
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
