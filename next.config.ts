import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./src/lib/images";

// Scripts stay open to AdSense, analytics and video players, which load code from many Google and partner domains.
// These rules close the common holes without breaking them: no framing by other sites, no plugins, no <base> tricks,
// and forms can only post back to this site.
const contentSecurityPolicy = [
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Only live: on http://localhost it would break the site's own images.
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Browsers only honour this over HTTPS, so it does nothing on localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Uploads stored in R2/S3 are resized too. The bucket address has to be known when the site is built.
const mediaHost = (() => {
  try {
    return process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL).hostname : "";
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  env: { MEDIA_HOST: mediaHost },
  poweredByHeader: false,
  // A CDN may keep showing a cached page while it fetches a fresh one, but never one older than an hour.
  expireTime: 3600,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Old WordPress addresses that news apps, feed readers and Google still have on file.
      { source: "/feed/:rest*", destination: "/feed.xml", permanent: true },
      { source: "/page/:n(\\d+)", destination: "/latest?page=:n", permanent: true },
    ];
  },
  async rewrites() {
    return {
      // WordPress links like /?p=123 point at the homepage, so they are checked before it renders.
      beforeFiles: [{ source: "/", has: [{ type: "query", key: "p", value: "\\d+" }], destination: "/wp-redirect" }],
      // Anything no page matches may be an old WordPress address. Unknown ones still get the 404 page.
      fallback: [{ source: "/:path((?!_next/|media/|api/).+)", destination: "/wp-redirect/:path" }],
    };
  },
  images: {
    // AVIF first, then WebP: both are far smaller than the JPEGs the newsroom uploads.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 640, 828, 1080, 1280, 1920],
    imageSizes: [104, 140, 180, 256],
    // Resized copies are cached for 30 days. Uploads never change once saved.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [...IMAGE_HOSTS, ...(mediaHost ? [mediaHost] : [])].map((hostname) => ({ protocol: "https" as const, hostname })),
  },
};

export default nextConfig;
