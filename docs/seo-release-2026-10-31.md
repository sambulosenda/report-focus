# SEO fixes — 31 October 2026

- Description clipping respects abbreviations and complete sentences, removes legacy bylines, and does not append invented punctuation. Article JSON-LD keeps the full cleaned excerpt.
- The US section has relevant metadata; section headings include News. The Zimbabwe, South Africa, Africa and Latest blurbs remain unchanged.
- Desktop and mobile header navigation share one list: Zimbabwe, South Africa, Africa, SA Elections, Live (when available), World, Politics, Crime, Business, US, Technology, Health, Climate, Sports, Entertainment. Video appears when available.
- Indexed topics require five distinct published, non-wire stories. Sitemap and tag-page robots use the same cached eligibility query; repeated spellings in one story count once.
- Training opt-outs in robots.txt cover GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended and Bytespider. AI search agents remain under the wildcard allow rule. These are crawler directives, not a Cloudflare firewall rule.
- Section landing pages use 60-second ISR. Pagination uses /section/page/N with 308 redirects from the old query-string links for known sections. Other list pagination and newsroom authentication are preserved.
- Unknown top-level paths receive a standalone HTML 404 with a visible H1 and one noindex tag. Before returning it, middleware checks a cached public route-existence endpoint so newly created categories and WordPress redirects still work. Normal known routes avoid this lookup. Deeper missing story paths retain Next.js's existing fallback behavior.
- Corrected article 1845's production standfirst from “elatives” to “Relatives”.
- AdSense remains deferred at the owner's request; valid ads.txt responses now include the requested cache header.

Validation: production build, TypeScript, six regression tests, local HTTP checks for caching, 404 markup, navigation and pagination, and desktop browser inspection. The mobile viewport showed the menu control, but the browser automation backend failed when opening the drawer; its shared list is verified in the implementation.

Search Console reindexing remains an account task: inspect the homepage and /us, request indexing, and verify sitemap.xml and news-sitemap.xml are submitted. No signed-in Search Console session was available.

## Production verification

Deployed successfully to Fly; both app and cron machine checks passed. Live checks confirmed:
- Homepage and US/Zimbabwe headers begin Zimbabwe, South Africa, Africa, SA Elections.
- US/Zimbabwe pages return 60-second shared-cache headers and News headings.
- robots.txt contains the training opt-outs and both sitemap links.
- A fresh unknown top-level URL returns HTTP 404 with its H1 and one noindex tag.
- The Sanctions description contains only its lead sentence, without the embedded byline.
- Kimberley metadata begins Relatives.
- The sitemap contains 311 tag URLs, down from the audit's 559.
- Signed-out newsroom requests redirect to login; old section pagination redirects to path pagination.
- /api/health returns HTTP 200 with {"ok":true}.

The 404 lookup uses loopback to reach its own API on Fly, avoiding public-host/proxy routing. The legacy byline test now uses the exact production excerpt shape, including the appended editor role and story text.
