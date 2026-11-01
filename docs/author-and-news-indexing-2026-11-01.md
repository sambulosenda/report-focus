# Author profile and Google News directives — 1 November 2026

Mickal Dube's public profile moves from `/author/sambulo-senda` to `/author/mickal-dube`. A permanent HTTP 301 retains access through existing links and preserves query parameters. `scripts/rename-mickal-author.mjs` changes only the existing user's slug, after checking the expected display name and ensuring there is no conflicting profile. The user ID, credentials, biography and article ownership remain unchanged. All byline links, author structured data and sitemap entries derive from this record.

The previous `googlebot-news` property was nested under `robots.googleBot`, which Next.js did not render. `pageMeta` now emits it through `metadata.other`, producing a separate `<meta name="googlebot-news" content="noindex">` on pages already marked `noNewsIndex`. General web indexing stays enabled for eligible hubs; normal article metadata has no News exclusion. This takes effect in search results after Google recrawls the pages, not immediately on deployment.

Validation: seven SEO tests; targeted ESLint; a fresh TypeScript check without incremental cache; an isolated database migration run twice, preserving author ID and article count. The initial incremental type check referenced missing generated `.next/types` files; the fresh check passed.

References:
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata#other
- https://support.google.com/news/publisher-center/answer/9605477

Production verification passed after deployment `01M6CDC32W02CFAV77KWZXBW2N`:
- Existing user ID 18 changed to `mickal-dube`; all 8 associated articles preserved.
- `/author/sambulo-senda?page=2` returns 301 to `/author/mickal-dube?page=2`.
- New author profile, `/us` and `/tag/impeachment` return 200 and emit both general `index, follow` and separate Google News `noindex` tags.
- Newest news-sitemap article links to the new profile and uses it for NewsArticle author URL and Person ID; it has no Google News exclusion tag.
- Main sitemap contains the new author URL and excludes the old URL.
- Live health endpoint returns 200 with `{"ok":true}`.
