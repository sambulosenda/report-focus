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
