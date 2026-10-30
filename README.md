# Report Focus News

A fast, modern news site with a built-in newsroom. Readers get an ABC News–style homepage, section fronts and article pages. Journalists and editors sign in to write, review and publish stories.

## What's inside

**Public site**

- Homepage: "Full coverage" topic chips, a headline stack, the lead story with a Report Focus Live strip, numbered Top Stories, a Trending videos band, section blocks and an Analysis & Opinion band
- Red breaking-news banner on every reader page (shows for 24 hours after an editor flags a story). Open pages check for a new one every minute, and readers can hide it
- Live updates: a live story gets a "Latest updates" box on the article and a full timeline at `/live/<slug>` with pinned posts and a "new updates" button; `/live` opens the current live story
- Video: video stories get a player page with Up next and autoplay; `/video` is the video hub
- Section pages (lead, river, most read, section newsletter), author pages, topic pages, a "Latest news" timeline, search that matches every word you type, with type tabs, sort, highlighting and pages, and a 404 page with search
- Article pages with breadcrumb, byline, share buttons, reading progress, "What to know" boxes, pull quotes, tags, author box, most read and more from the section
- Newsletters at `/newsletters`: The Morning Focus, breaking-news alerts and one per section. Readers confirm by email before they get anything, and every email has a one-click unsubscribe
- Standing pages linked from the footer (about, contact, standards, privacy and so on) live in `src/lib/site.ts`
- Pictures are resized and served as AVIF or WebP at the size each screen needs, and load only as they scroll into view
- Visitor stats with Plausible or Umami (no cookies): set `PLAUSIBLE_DOMAIN` or `UMAMI_WEBSITE_ID`. Reader pages only; the newsroom is never counted
- SEO built in: NewsArticle structured data, Open Graph and Twitter cards, canonical URLs, `sitemap.xml`, `robots.txt` and an RSS feed at `/feed.xml`
- Mobile-first layout, keyboard and screen-reader friendly, and respects reduced motion

**Newsroom (`/newsroom`)**

| Role | Can do |
| --- | --- |
| Writer | Write drafts, upload images, submit stories for review, edit their own story until it's published. Writers can't publish: an editor approves every story first |
| Editor | Everything above, plus edit any story, publish, schedule, unpublish, return a story to the writer with a note, archive, flag **Breaking** or **Top story**, manage sections |
| Admin | Everything above, plus add staff, change roles, deactivate people and make password reset links |

- Story editor with a "Ready to publish" checklist, headline counter, story type (news, analysis, opinion, explainer, live updates, video), lead image with required credit and alt text, tags, homepage placement, scheduling, and a search and social preview
- Markdown body with a formatting toolbar, live preview, word count, Ctrl/⌘+S to save and a warning before leaving with unsaved changes. Start a quote with `> **What to know**` to make a key-points box, and end a quote with `> — Name` to attribute it
- Live stories get a panel under the editor to post, pin and delete timeline updates
- Workflow: Draft → In review → Published (or Scheduled, if the publish time is in the future) → Archived
- Staff sign-in links: an admin adds someone on the Staff page and gets a link to send them. They choose their own password with it, so nobody else ever knows it. The same page makes a reset link for anyone who forgets their password. Links work once and last 7 days
- Image library with uploads (JPEG, PNG, WebP, GIF, AVIF up to 8 MB)
- Newsletters page for editors: readers per newsletter, a "send today's edition" button and a log of every send. Admins can download the reader list as CSV
- Dashboard with the breaking banner switch, an "email this alert" button for breaking-news subscribers, stats, a story table with status tabs and a breaking switch on each published story, what's scheduled next and recent activity

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router, React Server Components, Server Actions) and TypeScript
- Tailwind CSS 4
- [Drizzle ORM](https://orm.drizzle.team) on SQLite / [libSQL](https://turso.tech). Locally it's a file; in production point it at Turso.
- Password login with bcrypt and database-backed sessions in an http-only cookie

## Getting started

```bash
npm install
cp .env.example .env
npm run setup      # creates the database and loads sample content
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/login for the newsroom.

The seed creates these accounts, all with the password `newsroom-demo-2026` (set `SEED_PASSWORD` to choose another):

| Role | Email |
| --- | --- |
| Admin | admin@reportfocus.news |
| Editor | editor@reportfocus.news |
| Writer | daniel@reportfocus.news, grace@reportfocus.news, marcus@reportfocus.news |

**The sample stories are fictional placeholders.** Remove them, and change every password, before launch. `npm run db:seed -- --force` wipes and reseeds the database.

### Your own admin account

Create your admin account from the terminal. It asks for the password, so it's never typed into a file:

```bash
npm run admin:create -- --name "Your Name" --email you@example.com --replace-demo
```

`--replace-demo` moves the demo admin's stories to you and deletes `admin@reportfocus.news`. Leave it off to keep the demo account. Running the command again for the same email sets a new password. Add everyone else from the Staff page in the newsroom.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Load sample staff, sections and stories into an empty database |
| `npm run admin:create` | Create your own admin account (see above) |
| `npm run db:backup` | Save the whole database to `backups/*.sql` (and to `BACKUP_S3_BUCKET` when set) |
| `npm run uploads:move` | Copy images from `UPLOAD_DIR` to the S3/R2 bucket and point stories at the copies |
| `npm run import:wordpress -- <file or URL>` | Import posts from a WordPress site (see below) |
| `npm run typecheck` / `npm run lint` | Checks |

## Email

Newsletters and breaking-news alerts go through the provider named in `EMAIL_PROVIDER`:

- `console` (the default) writes each email to the server log. Use it locally, or until you pick a service. Confirmation links show up in the log.
- `resend` sends through [Resend](https://resend.com). Set `RESEND_API_KEY` and an `EMAIL_FROM` address on a domain you have verified with Resend.

Another service can be added in `src/lib/email.ts` with one function.

Each newsletter edition holds the five top stories of the past 24 hours. Editors can send one from **Newsroom → Newsletters**, or a scheduler can send them every weekday morning:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-site/api/newsletter/send
```

An edition goes out at most once a day, and an alert at most once per story, so retries are safe.

## Moving posts over from WordPress

`npm run import:wordpress` copies an old WordPress site's posts into the newsroom. It brings over headlines, text, the excerpt as the summary, categories (as sections), tags, authors, featured and inline images, publish dates and slugs. Old WordPress addresses such as `/2024/03/14/my-story/` and `/?p=123` keep working: they redirect to the new story page. Category pages such as `/category/politics/` redirect to the matching section. A category that was only ever a post's second or third category becomes a tag, not a section, so its old category page isn't redirected.

```bash
# From an export file: WordPress dashboard → Tools → Export → All content → Download Export File
npm run import:wordpress -- ~/Downloads/oldsite.WordPress.2026-10-30.xml --dry-run   # preview first
npm run import:wordpress -- ~/Downloads/oldsite.WordPress.2026-10-30.xml

# Or straight from the live site (published posts only)
npm run import:wordpress -- https://old-site.com
```

| Option | What it does |
| --- | --- |
| `--dry-run` | Show what would be imported, and how the first story will look, without changing anything |
| `--update` | Refresh stories that were already imported (they're skipped otherwise) |
| `--no-images` | Leave images on the old site instead of copying them (to the S3/R2 bucket when `S3_BUCKET` is set, otherwise `UPLOAD_DIR`) |
| `--image-delay=1000` | Milliseconds between image downloads. If the old host answers "too many requests", the importer waits and retries; rerun with `--update` to fetch any that still failed |
| `--author=<email>` | Credit every story to one existing staff account |
| `--section-map=news:us,sport:sports` | Put a WordPress category into an existing section (by slug) |
| `--default-section=<slug>` | Section for posts that are only "Uncategorized" (otherwise they go under `/news/…`) |
| `--include-pages` | Also import WordPress pages such as About |
| `--since=2025-01-01` | Only import posts published on or after this date |
| `--limit=<n>` | Only import the first n posts |

Good to know:

- Running it twice is safe. Posts are matched by their WordPress ID.
- Published and scheduled posts arrive published with their original dates; drafts arrive as drafts and "pending" posts as In review. Private and password-protected posts are left out.
- Categories that don't match an existing section become new sections, hidden from the menu until you switch them on.
- Writers are matched to staff by email or name. Anyone new gets a switched-off journalist account: an admin turns it on and sets a password before they can sign in.
- Galleries, contact forms and page-builder shortcodes can't be carried over and are dropped. Embedded videos become their link.
- Imported lead images have no photo credit, so the editor asks for one the next time someone edits that story.

## Deploying

The app needs a database and somewhere to keep uploaded images.

- **Database:** [Turso](https://turso.tech) (`DATABASE_URL` / `DATABASE_AUTH_TOKEN`) is recommended: it keeps automatic backups you can restore to any point in time. A SQLite file on a persistent disk also works on a single server.
- **Images:** set the `S3_*` settings in `.env.example` to store uploads in Cloudflare R2 or S3. Most hosts wipe the server's own disk on each deploy, so `UPLOAD_DIR` is only for local work or a server with a persistent volume. Moving later? Run `npm run uploads:move` once.
- **Order:** run `npm run db:migrate && npm run build && npm start`. The build reads the database to prepare the homepage, so `DATABASE_URL` must be set at build time too.

### Deploying on Fly.io

`Dockerfile` and `fly.toml` run the site on [Fly.io](https://fly.io) with Turso as the database and an R2 bucket for images. Fly starts two kinds of machine:

- `app`: the website. One machine stays on all the time, because page caches and the view counter live in its memory. Keep it at one (`fly scale count app=1`).
- `cron`: the scheduled jobs in `deploy/cron.sh`. It sends the day's newsletters each weekday at `NEWSLETTER_TIME` (default 06:30, in `SITE_TIMEZONE`) and, when `BACKUP_S3_BUCKET` is set, backs up the database every night at 02:15.

First deploy:

1. Put the Turso database address in both `DATABASE_URL` lines of `fly.toml`, and the bucket's public address in both `S3_PUBLIC_URL` lines.
2. Create the app without deploying: `fly launch --no-deploy --copy-config`.
3. Set the secrets (each one is typed into your terminal, never into a file):
   `fly secrets set DATABASE_AUTH_TOKEN=... CRON_SECRET=... S3_BUCKET=... S3_ENDPOINT=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=...`
   Add `RESEND_API_KEY` (and `EMAIL_PROVIDER = "resend"` in `fly.toml`), `BACKUP_S3_BUCKET` and `SENTRY_DSN` when you have them.
4. Deploy. The build runs the migrations and reads the database, so it needs the Turso token too:
   `fly deploy --ha=false --build-secret DATABASE_AUTH_TOKEN="$(turso db tokens create <db name>)"`
5. Check `https://<app>.fly.dev`, then point the domain at it: `fly certs add reportfocusnews.com` and follow what it prints.

### Caching and traffic spikes

Reader pages are cached and rebuilt at most once a minute (live pages every 15 seconds). Publishing, editing or posting a live update refreshes them straight away. Each page is sent with `Cache-Control: s-maxage=…`, so a CDN can serve it too:

- Put [Cloudflare](https://www.cloudflare.com) (free plan) in front of the site, and add a Cache Rule that caches everything except `/newsroom*`, `/login*` and `/api/newsletter*`, respecting the origin's cache headers.
- Pages that read the address bar (`?page=2`, search, newsletter links) are still built for each visit.
- Story views are counted by a small request from the reader's browser to `/api/views/<id>` and written to the database in batches every 10 seconds.

### Monitoring and backups

- **Errors:** create a free project on [Sentry](https://sentry.io) and set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (the second one before building). Nothing is sent while they are empty.
- **Uptime:** point an uptime checker (Better Stack, UptimeRobot) at `/api/health`. It answers 200 when the site can reach its database and 503 when it can't.
- **Backups:** besides Turso's own backups, schedule `npm run db:backup` nightly with `BACKUP_S3_BUCKET` set to a private bucket. Restore with `sqlite3 new.db < backups/<file>.sql`. Try a restore once before launch.

### Security

- Security headers (no framing by other sites, HSTS, no plugins, forms post only to this site) are set in `next.config.ts`.
- Sign-in allows 5 wrong passwords per account and 20 per IP address in 15 minutes. Counts are kept in the database, so they hold across restarts.

Set `SITE_URL` to your public address so RSS, sitemap and share links are correct.

Optional settings:

- `SITE_TIMEZONE` and `NEXT_PUBLIC_SITE_TIMEZONE`: the newsroom's time zone for dates and times on the site (default `America/New_York`)
- `NEXT_PUBLIC_SOCIAL_X`, `_FACEBOOK`, `_INSTAGRAM`, `_LINKEDIN`, `_YOUTUBE`, `_TIKTOK`: profile links for the footer icons. X (@reportfocus), Facebook, Instagram and LinkedIn (/reportfocusnews) are set by default in `src/lib/site.ts`; YouTube and TikTok only show once set
- `NEXT_PUBLIC_AD_SLOTS=on`: shows the 300 × 250 ad spaces on section and live pages

## Project layout

```
src/
  app/(site)/        public pages: home, [section], [section]/[slug], live, video, author, tag, latest, search
  app/newsroom/      the CMS
  app/login/         sign in
  actions/           server actions (articles, auth, admin)
  components/        site and newsroom UI
  db/                Drizzle schema and client
  lib/               auth, permissions, queries, markdown, storage
scripts/             migrate and seed
drizzle/             SQL migrations
```
