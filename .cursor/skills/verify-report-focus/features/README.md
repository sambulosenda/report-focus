# Report Focus verification map

This directory is the maintained source for verifying reader-facing behavior of Report Focus News. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `node .cursor/skills/verify-report-focus/scripts/control.mjs launch`.
- The server is `http://127.0.0.1:4173` unless `VERIFY_PORT` was set. The database is the SQLite file printed as `data=` by `doctor`, not `data/report-focus.db` and not Turso.
- The seed lead is `Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding` at `/climate/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding`.
- Run `node .cursor/skills/verify-report-focus/scripts/control.mjs doctor` and require `doctor ok` plus that lead line.
- Never drive a `next dev` this launch did not start. One checkout, one server.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer the accessible names in each feature file over element position.
- Treat every command as literal. Keep quoted headlines and query strings unchanged.
- Run fetches through `node .cursor/skills/verify-report-focus/scripts/control.mjs get`.
- Cleanup removes the server and its database. It does not remove `evidence/`.

## Proof and skip reporting

- Capture the fetch and the HTML it returned, not only `doctor ok`.
- Proof is an evidence HTML file that contains the headline, result text, or gate the recipe names, plus a second fetch where the recipe asks for one.
- Record the feature file and the path used in the evidence meta JSON (`--save` does this).
- Report an unreachable path with the command you ran and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with control.mjs` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Homepage](./homepage.md) covers the lead story, the header, and opening that story from the homepage.
- [Search](./search.md) covers a matching query, highlighted words, and a query with no stories.
- [Story](./story.md) covers opening a story from its section URL and from a mismatched section URL.
- [Live updates](./live.md) covers the Live nav entry and the timeline, including the pinned update.
- [Newsroom sign-in](./sign-in.md) covers the signed-out gate and the sign-in form. Submitting the password is not driven by this harness.
