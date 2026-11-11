import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "dist",
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
