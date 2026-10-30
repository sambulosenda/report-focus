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
- SEO built in: NewsArticle structured data, Open Graph and Twitter cards, canonical URLs, `sitemap.xml`, `robots.txt` and an RSS feed at `/feed.xml`
- Mobile-first layout, keyboard and screen-reader friendly, and respects reduced motion

**Newsroom (`/newsroom`)**

| Role | Can do |
| --- | --- |
| Journalist | Write drafts, upload images, submit stories for review, edit their own story until it's published |
| Editor | Everything above, plus edit any story, publish, schedule, unpublish, return a story to the writer with a note, archive, flag **Breaking** or **Top story**, manage sections |
| Admin | Everything above, plus create staff accounts, change roles, deactivate people and reset passwords |

- Story editor with a "Ready to publish" checklist, headline counter, story type (news, analysis, opinion, explainer, live updates, video), lead image with required credit and alt text, tags, homepage placement, scheduling, and a search and social preview
- Markdown body with a formatting toolbar, live preview, word count, Ctrl/⌘+S to save and a warning before leaving with unsaved changes. Start a quote with `> **What to know**` to make a key-points box, and end a quote with `> — Name` to attribute it
- Live stories get a panel under the editor to post, pin and delete timeline updates
- Workflow: Draft → In review → Published (or Scheduled, if the publish time is in the future) → Archived
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
| Journalist | daniel@reportfocus.news, grace@reportfocus.news, marcus@reportfocus.news |

**The sample stories are fictional placeholders.** Remove them, and change every password, before launch. `npm run db:seed -- --force` wipes and reseeds the database.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Load sample staff, sections and stories into an empty database |
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

## Deploying

The app needs a database and somewhere to keep uploaded images.

- **Simplest:** a single server or container with a persistent disk (Railway, Render, Fly.io, a VPS). Keep `DATABASE_URL=file:./data/report-focus.db` and `UPLOAD_DIR` on the persistent volume, then run `npm run build && npm run db:migrate && npm start`.
- **Vercel / serverless:** the filesystem isn't persistent, so use [Turso](https://turso.tech) for `DATABASE_URL` / `DATABASE_AUTH_TOKEN`, and replace `saveImage` in `src/lib/storage.ts` with S3, Cloudflare R2 or Vercel Blob.

Set `SITE_URL` to your public address so RSS, sitemap and share links are correct.

Optional settings:

- `SITE_TIMEZONE` and `NEXT_PUBLIC_SITE_TIMEZONE`: the newsroom's time zone for dates and times on the site (default `America/New_York`)
- `NEXT_PUBLIC_SOCIAL_X`, `_FACEBOOK`, `_INSTAGRAM`, `_YOUTUBE`, `_TIKTOK`: profile links for the footer icons (icons show unlinked until set)
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
