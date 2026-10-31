# Newsroom sign-in

A signed-out visitor who opens the newsroom lands on the staff sign-in form. Submitting a password is a separate step this harness does not perform.

## Sub-features

- `sign-in-gate` sends `/newsroom` to the sign-in page when there is no session cookie.
- `sign-in-form` shows the work-email field, the password field, and the `Sign in` button.
- `sign-in-submit` is the staff password submission. This harness has no command for it.

## How to get to it (user POV)

- Choose `Sign in` in the header. That link is `href="/login"`.
- Open `/login`.
- Open `/newsroom` while signed out.

## Driving it with control.mjs

Preconditions:

- `doctor ok` at `http://127.0.0.1:4173`.
- The fetch sends no `rf_session` cookie. `control.mjs get` does not send one.

- **Open the newsroom signed out.** Go to `/newsroom`. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /newsroom --manual --expect-status 307 --expect-location /login --save newsroom-gate`. Status is 307 and `location` contains `/login`. This proves `sign-in-gate` only. It does not prove a signed-in newsroom.
- **Open the form.** Choose `Sign in`. Run `node .cursor/skills/verify-report-focus/scripts/control.mjs get /login --expect "Sign in" --expect "Work email" --expect "For Report Focus News staff." --save sign-in`. Status is 200. The HTML contains an `h1` `Sign in`, the label `Work email`, a password input named `password`, and a button `Sign in`.
- **Submit the password.** Not driven. There is no `control.mjs` command that posts the Next.js server action. Report `sign-in-submit` as not driven, with that reason. Do not insert a session row to skip it.
- **Proof.** `newsroom-gate.meta.json` has status 307 and a location containing `/login`. `sign-in.html` contains `Work email` and `Sign in`. Neither file is proof of `sign-in-submit`.

## Gotchas

- The edge gate checks that a cookie named `rf_session` exists, not that the session is valid. This recipe sends no cookie. A fetch that adds any `rf_session` value is a different test and does not satisfy `sign-in-gate`.
- Following the redirect would show the form and hide the 307. Use `--manual` for the gate.
- The seeded password is `newsroom-demo-2026` for `editor@reportfocus.news` and the other seed accounts. Knowing the password is not a signed-in proof.
- `Forgot password?` opens a note telling the reader to ask an admin. It does not send email.
