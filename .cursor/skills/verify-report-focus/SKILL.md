---
name: verify-report-focus
description: "Drive Report Focus News, the local Next.js site, the way a reader or a signed-out journalist would. Use when a change touches the public site, search, a story page, live updates, or the newsroom sign-in gate, and the proof has to be the running app."
---

# Verify Report Focus

Report Focus News is a Next.js site. Readers use the public pages. Journalists use `/newsroom`, which sends a signed-out visitor to `/login`. This skill starts one isolated copy, checks that the seeded lead story is actually on the homepage, and records what a fetch returned.

The harness is `node .cursor/skills/verify-report-focus/scripts/control.mjs`. Run it from anywhere. It does not read `.env`, so it will not open the Turso database or the developer's `data/report-focus.db`.

One checkout can run one verification server. Next writes `.next` in the repo, and a second `next dev` corrupts that cache. `launch` refuses when a verification pid from a previous launch is still alive. Two copies side by side need two checkouts.

## Launch

```bash
node .cursor/skills/verify-report-focus/scripts/control.mjs launch
```

Optional: `VERIFY_PORT` (default `4173`) and `VERIFY_ID` (default `current`).

Launch migrates and seeds a new SQLite file under `.cursor/skills/verify-report-focus/runs/<id>/`, then starts `next dev` on `127.0.0.1`. The dev server polls for file changes so it can still start when the machine caps native file watchers. Ready is the line `ready http://127.0.0.1:4173` after both of these are true:

- `GET /api/health` returns `{"ok":true}`
- `GET /` contains the seeded lead headline `Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding`

A database that answers `select 1` while the seed is missing is not ready. The seed accounts use the password `newsroom-demo-2026`. Sample stories are fictional.

Teardown is `cleanup` below. Cleanup stops the pid this launch wrote down. It does not delete `.cursor/skills/verify-report-focus/evidence/`.

## Doctor

Run this first whenever a page looks wrong.

```bash
node .cursor/skills/verify-report-focus/scripts/control.mjs doctor
```

`doctor ok` means the recorded pid is alive, `/api/health` returns ok, and the homepage still shows that lead headline. It also prints `url`, `pid`, `data`, `version` (from `package.json`), and `lead`. Anything else is `doctor fail`. Do not drive a server that fails the doctor, and do not drive a `next dev` you did not launch.

## Drive

Fetch a path on the server this launch started. The command follows redirects unless `--manual` is set. `--expect` can be repeated. `--expect-status` checks the status before following. `--save name` writes the body to `evidence/<name>.html` and the status, final URL, and missing expects to `evidence/<name>.meta.json`. A manual fetch saves only the meta file.

```bash
node .cursor/skills/verify-report-focus/scripts/control.mjs get / --expect "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding" --save homepage
node .cursor/skills/verify-report-focus/scripts/control.mjs get /climate/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding --expect "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding" --save lead-story
node .cursor/skills/verify-report-focus/scripts/control.mjs get "/search?q=rainfall" --expect "Storm system brings record rainfall" --save search
node .cursor/skills/verify-report-focus/scripts/control.mjs get /newsroom --manual --expect-status 307 --expect-location /login --save newsroom-gate
```

Stable handles, from the pages: the header link `Report Focus News home` (`/`), the header link `Search` (`/search`), the search form `role="search"` with label `Search Report Focus News` and button `Search`, the homepage `h1` `Report Focus News: top stories`, the lead story as an `h2` link, a story `h1` with the headline, the live page section named `Updates`, the sign-in `h1` `Sign in`, the label `Work email`, and the button `Sign in`.

The feature map in `features/` is the list of journeys. A proof that only opens one convenient URL is incomplete when that feature lists more entry points. Read `features/README.md` before choosing a journey.

The password form posts a Next.js server action. This harness cannot submit it. Seeing the sign-in form is not a signed-in newsroom.

## Evidence

Save proof under `.cursor/skills/verify-report-focus/evidence/`. Record the path that was fetched and the HTML that came back, then open a second reader-facing URL that shows the same fact (the story page after the homepage, the results after a search). A passing status line is not the proof. The body has to contain the headline, the result count, or the sign-in gate.

Do not mint a session row or call a server action from a script and call that the user path. Ads, analytics, and Resend are off in this server (`EMAIL_PROVIDER=console`, no `S3_BUCKET`). Nothing in a normal page fetch should call them. If a run claims a dry path, confirm the server log has no outbound send.

## Cleanup

```bash
node .cursor/skills/verify-report-focus/scripts/control.mjs cleanup
```

`cleanup ok` means the spawn pid and the pid listening on the verification port were signalled, and `runs/<id>/` was removed. `next dev` can be the child that is listening, so both pids are recorded at launch. Cleanup fails if either pid is still alive. The evidence directory stays. Do not kill a process by name. If launch fails halfway, run cleanup anyway so the port and pid are not left behind. Launch already removes a server that never became ready.

## Helpers

`node .cursor/skills/verify-report-focus/scripts/control.mjs` with `launch`, `doctor`, `get`, or `cleanup`, as shown above. There is no other helper.
