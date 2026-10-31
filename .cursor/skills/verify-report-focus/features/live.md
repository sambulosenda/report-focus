# Live updates

The Live entry opens the current live story's timeline. The seeded Gulf Coast story is that timeline, and one update is pinned.

## Sub-features

- `live-open` redirects `/live` to the current live story.
- `live-timeline` shows the story headline and the update titles.
- `live-pin` shows the pinned update `What we know right now`.

## How to get to it (user POV)

- Choose `Live` in the section nav. The seed has a live story, so this opens the timeline rather than a list.
- Open `/live`.
- Open `/live/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding`.

## Driving it with control.mjs

Preconditions:

- `doctor ok` at `http://127.0.0.1:4173`.
- The seeded Gulf Coast story is `kind` live and has the five seed updates.

- **Open Live.** Choose `Live`. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /live --expect "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding" --expect "What we know right now" --expect "PINNED" --save live`. The final URL is `/live/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding`. The HTML contains the headline in an `h1`, a region labelled `Updates`, the update heading `What we know right now`, and the text `PINNED`.
- **Open the timeline directly.** Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /live/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding --expect "Shelters open in four cities" --expect "Warnings now cover six counties" --save live-direct`. Status is 200 and the final URL is that path. The HTML contains those update headings.
- **Proof.** `live.meta.json` records the `/live/<slug>` final URL. `live-direct.html` contains `What we know right now` and `PINNED`.

## Gotchas

- `/live` redirects when a story is live. The list headed `Live` with `Nothing is live right now` means this database is not the seed.
- The page `h2` `What we know` is the story summary box. The pinned update is the `h3` `What we know right now`. Either string alone is the wrong proof.
- `Reporting by Marcus Bell` is the seeded byline. Do not require a different author.
