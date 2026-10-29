# Report Focus

A fast, modern news site with a built-in newsroom. Readers get an ABC News–style homepage, section fronts and article pages. Journalists and editors sign in to write, review and publish stories.

## What's inside

**Public site**

- Homepage with a lead story, top stories, a live "Latest headlines" column, a "Most read" panel and a rail for every section
- Red breaking-news banner (shows for 24 hours after an editor flags a story) and a scrolling "Latest" ticker
- Section pages, author pages, topic (tag) pages, a "Latest news" timeline and search
- Article pages with byline, reading time, hero image and caption, share buttons, related stories and most read
- SEO built in: NewsArticle structured data, Open Graph and Twitter cards, canonical URLs, `sitemap.xml`, `robots.txt` and an RSS feed at `/feed.xml`
- Mobile-first layout, keyboard and screen-reader friendly, and respects reduced motion

**Newsroom (`/newsroom`)**

| Role | Can do |
| --- | --- |
| Journalist | Write drafts, upload images, submit stories for review, edit their own story until it's published |
| Editor | Everything above, plus edit any story, publish, schedule, unpublish, return a story to the writer with a note, archive, flag **Breaking** or **Top story**, manage sections |
| Admin | Everything above, plus create staff accounts, change roles, deactivate people and reset passwords |

- Markdown editor with a formatting toolbar, live preview, word count, Ctrl/⌘+S to save and a warning before leaving with unsaved changes
- Workflow: Draft → In review → Published (or Scheduled, if the publish time is in the future) → Archived
- Image library with uploads (JPEG, PNG, WebP, GIF, AVIF up to 8 MB)
- Dashboard with a review queue, your drafts and newsroom stats

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

## Deploying

The app needs a database and somewhere to keep uploaded images.

- **Simplest:** a single server or container with a persistent disk (Railway, Render, Fly.io, a VPS). Keep `DATABASE_URL=file:./data/report-focus.db` and `UPLOAD_DIR` on the persistent volume, then run `npm run build && npm run db:migrate && npm start`.
- **Vercel / serverless:** the filesystem isn't persistent, so use [Turso](https://turso.tech) for `DATABASE_URL` / `DATABASE_AUTH_TOKEN`, and replace `saveImage` in `src/lib/storage.ts` with S3, Cloudflare R2 or Vercel Blob.

Set `SITE_URL` to your public address so RSS, sitemap and share links are correct.

## Project layout

```
src/
  app/(site)/        public pages: home, [section], [section]/[slug], author, tag, latest, search
  app/newsroom/      the CMS
  app/login/         sign in
  actions/           server actions (articles, auth, admin)
  components/        site and newsroom UI
  db/                Drizzle schema and client
  lib/               auth, permissions, queries, markdown, storage
scripts/             migrate and seed
drizzle/             SQL migrations
```
