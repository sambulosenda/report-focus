import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

// Read SITE_URL when the site runs, not when it is built.
export const dynamic = "force-dynamic";

/**
 * One User-agent group. Cloudflare's managed robots.txt is prepended at the edge as a second group;
 * crawlers that only read the first group miss these Disallow lines until that managed block is turned
 * off, or these four paths are added to it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/newsroom", "/login", "/search", "/api/"] },
    sitemap: [siteUrl("/sitemap.xml"), siteUrl("/news-sitemap.xml")],
  };
}
