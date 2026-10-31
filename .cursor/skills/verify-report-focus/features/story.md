# Story

A published story is readable at `/<section>/<slug>`, and a URL that uses the wrong section sends the reader to the right one.

## Sub-features

- `story-read` shows the headline, the summary, and the body on the story URL.
- `story-section` redirects a mismatched section to the story's own section.

## How to get to it (user POV)

- Choose a headline on the homepage, a section page, or a search result.
- Open the story path directly.

## Driving it with control.mjs

Preconditions:

- `doctor ok` at `http://127.0.0.1:4173`.
- The Gulf Coast story is the seeded lead in section `climate`.

- **Open the story.** Go to its section URL. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /climate/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding --expect "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding" --expect "Forecasters say parts of the region could see a month" --expect "A slow-moving storm system parked over the Gulf Coast" --save story`. Status is 200. The final URL is that path. The HTML contains an `h1` with the headline, the summary sentence, and the body sentence.
- **Open the wrong section.** Go to `/world/` plus the same slug. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /world/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding --expect "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding" --save story-redirect`. The final URL is the `/climate/` path, and the HTML contains the same `h1`.
- **Proof.** Both saved HTML files contain the headline. `story.meta.json` and `story-redirect.meta.json` each have `finalUrl` ending in `/climate/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding`.

## Gotchas

- A wrong section is a permanent redirect, not a 404. Follow redirects. The harness does. `--manual` would stop on the redirect and is the wrong command for this recipe.
- The slug is the seeded headline, lowercased, with spaces turned into hyphens, cut at 90 characters. Do not invent a shorter slug.
- Drafts and stories in review are not on this URL. `School board weighs later start times for high schools` is in review and must not appear as a public story.
