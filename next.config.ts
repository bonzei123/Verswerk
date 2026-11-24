import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Allow both localhost and 127.0.0.1 during local/dev preview & HMR
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
