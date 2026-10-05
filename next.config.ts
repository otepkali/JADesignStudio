import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/", destination: "/studio/index.html" }];
  },
};

export default nextConfig;
