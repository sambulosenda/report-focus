import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // WordPress links like /?p=123 point at the homepage, so they are checked before it renders.
      beforeFiles: [{ source: "/", has: [{ type: "query", key: "p", value: "\\d+" }], destination: "/wp-redirect" }],
      // Anything no page matches may be an old WordPress address. Unknown ones still get the 404 page.
      fallback: [{ source: "/:path((?!_next/|media/|api/).+)", destination: "/wp-redirect/:path" }],
    };
  },
};

export default nextConfig;
