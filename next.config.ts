import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A CDN may keep showing a cached page while it fetches a fresh one, but never one older than an hour.
  expireTime: 3600,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
