import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker: emits a self-contained server.js + static assets
  output: "standalone",
};

export default nextConfig;
