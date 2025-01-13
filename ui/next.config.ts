// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    // Ensure TypeScript files outside of the Next.js directory are processed
    config.module.rules.push({
      test: /\.ts$/,
      include: [path.resolve(__dirname, "../shared")],
      use: [defaultLoaders.babel],
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      "@shared": path.resolve(__dirname, "../shared"),
    };

    return config;
  },
};

module.exports = nextConfig;
