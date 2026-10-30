import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

// Read SITE_URL when the site runs, not when it is built.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/newsroom", "/login", "/search", "/api/"] },
    sitemap: [siteUrl("/sitemap.xml"), siteUrl("/news-sitemap.xml")],
  };
}
