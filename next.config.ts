import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./src/lib/images";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, then WebP: both are far smaller than the JPEGs the newsroom uploads.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 828, 1080, 1280, 1920],
    imageSizes: [104, 140, 180, 256],
    // Resized copies are cached for 30 days. Uploads never change once saved.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
};

export default nextConfig;
