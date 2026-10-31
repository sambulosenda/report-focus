import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

// Read SITE_URL when the site runs, not when it is built.
export const dynamic = "force-dynamic";

/** Training opt-outs are separate from search discovery and user-requested visits. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/newsroom", "/login", "/search", "/api/"] },
      { userAgent: ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Applebot-Extended", "Bytespider"], disallow: "/" },
    ],
    sitemap: [siteUrl("/sitemap.xml"), siteUrl("/news-sitemap.xml")],
  };
}
