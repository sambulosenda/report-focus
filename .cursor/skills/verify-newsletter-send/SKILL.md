---
name: verify-newsletter-send
description: "Prove that a Report Focus newsletter edition goes out at most once per day and a breaking alert at most once per story. Use when a change touches claimAndSend, sendEdition, sendBreakingAlert, or the email_sends unique indexes."
---

# Newsletter send, at most once

A reader must not get the same Morning Focus edition twice, and must not get two breaking alerts for the same story, including when an editor clicks Send while the cron job is already sending. A send that the email service refuses must leave no claim behind, so the next try can still go out.

The check is `node .cursor/skills/verify-newsletter-send/check.mjs` from the repo root (the script finds the repo itself). It exits 0 when the model and the live calls agree. It exits 1 when a double send is possible. It exits 2 when the property holds but the covered files differ from the sync commit below: the pass is not a confirmation yet.

## When a change touches this

Covered code:

- `claimAndSend`, `sendEdition`, and `sendBreakingAlert` in `src/lib/newsletters.ts`
- `emailSends` in `src/db/schema.ts`
- the unique indexes in `drizzle/0002_newsletter_alerts.sql`

Sync commit: `d0e0ab0b12d9296b3bd0248851d9975cf445a04e`

If `git diff <sync> --` those three paths is non-empty, read the diff before trusting a pass. Move the sync commit forward only after the model steps and the live calls still describe the code at the new commit. A pass on drifted code exits 2 on purpose.

## Run

```bash
node .cursor/skills/verify-newsletter-send/check.mjs
```

No JRE. This machine has no Java runtime, so the checker is not TLC. It runs the TypeScript with `node --import tsx` (the `tsx` binary's helper socket is not required). Overlap is an ordering question, and the checker enumerates the orders itself: two actors (`editor` and `cron`), two tries each, one claim key. The indivisible step in the faithful model is `insertClaim`, because the SQLite unique index makes the insert one step in `claimAndSend`. `sendEmails ok` leaves the row. `sendEmails fail; deleteClaim` removes it, matching the `catch` that deletes `email_sends` by id.

The same command then migrates a temporary SQLite file and runs `live.ts`, which calls the real functions:

- two overlapping `sendEdition("morning-focus")` calls
- two overlapping `sendBreakingAlert` calls for one story
- `sendEdition("section-us")` with `EMAIL_PROVIDER=resend` and no API key, which must refuse and leave no row, then one console retry, then a third call that is blocked

One confirmed subscriber each. One published US story. `EMAIL_PROVIDER=console` counts a line containing `[email]` as one delivery. The temporary database is deleted at the end. This does not use `.env` or Turso.

## What a failure means

`model fail` on the faithful steps means the model no longer matches the promise. Fix the model only when the code's steps changed and the new steps are the intended ones.

`broken variant` is printed on every successful run. It is a check-then-insert with no unique index: both actors read an empty `email_sends`, both insert, both call `sendEmails`. If that variant does not show a double send, the checker can no longer see the bug and the run fails.

A live failure names which call emailed twice, rejected, left a claim after a refusal, or blocked a retry. That is a bug in the current code, or a scratch edit that removed the claim. Do not weaken the expects. Do not change product code to make the check pass unless someone asked for a product fix.

A thrown error from the second overlapping insert, with only one `[email]` line, still meets "at most once". The live check does not require the friendly "already gone out" wording on the overlap. It does require that wording on the sequential third `section-us` call, and it requires the refused send to delete the row.

## What this does not cover

- More than two overlapping callers, or more than two tries by one caller.
- Two different edition dates or two different stories. Those are different claim keys and are allowed to send once each.
- SQLite treats NULL as distinct in a unique index. `email_sends_edition_idx` is `(list, edition)` and `email_sends_alert_idx` is `(list, article_id)`. An edition claim must set `edition`. An alert claim must set `articleId`. The live calls do. A claim that left the key null could be inserted twice, and this check would catch that for the paths it calls.
- Delivery by Resend, the recipient query, and the email HTML. Console mode stands in for the provider. A refusal is the Resend branch with no API key.
- The login rate limit in `src/lib/rate-limit.ts` is a separate promise (5 failures per account and 20 per address in 15 minutes) and is not checked here.

## Reading a result

The broken-variant lines are the shortest double send, in the code's words (`read email_sends`, `insertClaim`, `sendEmails`). The live JSON line is the passing run of the real functions. stderr may include `Error: RESEND_API_KEY is not set.` That is the refused `section-us` send, which the code logs before deleting the claim. The run passed when the process exits 0 and the JSON says `"ok":true`. There is no TLA+ file. Do not look for a TLC trace.
