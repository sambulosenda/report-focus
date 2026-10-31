# Homepage

The homepage shows the current lead story, with its headline linking to the story, and the same headline is still on that story page.

## Sub-features

- `home-lead` shows the seeded lead headline on the homepage.
- `home-open-lead` opens that story from the homepage link and shows the same headline.
- `home-header` shows the masthead link and the search link.

## How to get to it (user POV)

- Open the site root.
- Choose the masthead, which is the link named `Report Focus News home`.

## Driving it with control.mjs

Preconditions:

- `doctor ok` at `http://127.0.0.1:4173`.
- The lead line from doctor is `Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding`.

- **Open the homepage.** Go to the site root. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get / --expect "Report Focus News: top stories" --expect "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding" --expect "Report Focus News home" --expect "Search" --save homepage`. Status is 200. The saved HTML contains the `h1` text `Report Focus News: top stories`, an `h2` link whose text is the lead headline, `href="/climate/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding"`, and the header links named `Report Focus News home` and `Search`.
- **Open the lead.** Choose the lead headline. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /climate/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding --expect "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding" --save homepage-lead`. Status is 200 and the final URL is that story path. The saved HTML contains the headline in an `h1`.
- **Proof.** Both evidence files exist and both contain the full lead headline. The homepage file also contains the story path.

## Gotchas

- The red breaking banner can repeat the lead headline. The proof is the `h2` link and the story `h1`, not the banner alone.
- The homepage `h1` is visually hidden. It is still in the HTML as `Report Focus News: top stories`.
- Sample stories are fictional placeholders from the seed. A missing lead means this server is not the seeded database.
- Featured order is by publish time. The Gulf Coast story is the newest featured story in the seed, so it is the lead. Do not assert a random "most read" headline. View counts in the seed are random.
