# Search

Search lists published stories that contain every word of the query, highlights those words in the headline, and says when nothing matches.

## Sub-features

- `search-match` finds the Gulf Coast story for `rainfall`.
- `search-highlight` wraps the matched word in `mark`.
- `search-empty` shows `No results` for a word no story uses.

## How to get to it (user POV)

- Choose the header link named `Search`.
- Open `/search` and submit the search form (`role="search"`, label `Search Report Focus News`, button `Search`).
- Open `/search?q=rainfall` directly.

## Driving it with control.mjs

Preconditions:

- `doctor ok` at `http://127.0.0.1:4173`.
- The seeded Gulf Coast story is published.

- **Open search.** Choose `Search` in the header. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /search --expect "Search Report Focus News" --expect "Search" --save search-form`. Status is 200. The HTML contains a form with `role="search"`, the label `Search Report Focus News`, and a button labelled `Search`.
- **Search for a story.** Submit `rainfall`. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get "/search?q=rainfall" --expect "result" --expect "Storm system brings record rainfall" --expect "<mark" --save search-rainfall`. Status is 200. The HTML contains a result count for `rainfall`, the Gulf Coast headline, and a `mark` element around the matched word.
- **Search with no match.** Submit `zzzznotastory`. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get "/search?q=zzzznotastory" --expect "No results for" --save search-empty`. Status is 200. The HTML contains `No results for “zzzznotastory”` and does not contain the Gulf Coast headline.
- **Proof.** `search-rainfall.html` contains the headline and a `mark`. `search-empty.html` contains the no-results heading and not the headline.

## Gotchas

- Every word has to match. `rainfall gulf` still finds the lead. An extra unrelated word finds nothing.
- Highlighting skips one-letter words. Do not use a one-letter query as the highlight proof.
- The result count text is `1 result` or `N results` followed by `for`. Assert `result` and the headline, not a fixed count, because other seeded stories may also contain the word.
- Search is not the homepage. A homepage that mentions rain is not a search result.
