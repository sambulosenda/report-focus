import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

// Read SITE_URL when the site runs, not when it is built.
export const dynamic = "force-dynamic";

/**
 * Deliberate split: AI training crawlers are blocked, AI search and user-requested fetchers are not.
 * The blocked agents collect pages to train models. ChatGPT search, Perplexity and Claude's search and user
 * fetchers answer questions live, read /llms.txt, and cite and link back. Google-Extended only opts out of
 * Gemini training; Search and AI Overviews use Googlebot. Unblocking a training crawler gives content away.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/newsroom", "/login", "/search", "/api/"] },
      { userAgent: ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Applebot-Extended", "Bytespider"], disallow: "/" },
    ],
    sitemap: [siteUrl("/sitemap.xml"), siteUrl("/news-sitemap.xml")],
  };
}
