import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // IMPORTANT: Only use basePath and assetPrefix if your site URL looks like:
  // https://your-username.github.io/otdsp/
  // If your site is just https://your-username.github.io/, delete these two lines:
  basePath: "/otdsp",
  assetPrefix: "/otdsp",
};

export default nextConfig;