import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // If your repo is named "otdsp-website", uncomment the line below and change the name
  basePath: "/otdsp",
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
