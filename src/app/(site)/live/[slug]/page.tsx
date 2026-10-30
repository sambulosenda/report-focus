import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { LiveBadge } from "@/components/LiveBadge";
import { LiveRefresh } from "@/components/LiveRefresh";
import { CopyLinkButton } from "@/components/ShareButtons";
import { Duration, SectionTitle, StoryImage, storyHref } from "@/components/Story";
import { renderMarkdown } from "@/lib/markdown";
import { pageMeta } from "@/lib/seo";
import { liveUpdatesFor, liveUpdateStats, publicArticle, relatedStories, storiesOfKind } from "@/lib/queries";
import { excerpt, formatTime, siteUrl, timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ all?: string }> };
const FIRST_PAGE = 20;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await publicArticle((await params).slug);
  if (!row || row.article.kind !== "live") return {};
  const { article } = row;
  return pageMeta({
    title: `Live updates: ${article.title}`,
    description: article.summary || excerpt(article.body, 160),
    path: `/live/${article.slug}`,
    image: article.heroImage ? { url: article.heroImage, alt: article.heroAlt } : null,
    openGraph: { type: "article", publishedTime: article.publishedAt?.toISOString(), modifiedTime: article.updatedAt.toISOString() },
  });
}

export default async function LiveUpdatesPage({ params, searchParams }: Props) {
  const row = await publicArticle((await params).slug);
  if (!row || row.article.kind !== "live") notFound();
  const { article, category, author } = row;
  const showAll = (await searchParams).all === "1";
  // The first screen loads 20 updates; "Show earlier updates" loads the whole timeline.
  const [shown, stats, related, videos] = await Promise.all([
    liveUpdatesFor(article.id, showAll ? undefined : FIRST_PAGE + 1),
    liveUpdateStats(article.id),
    relatedStories(article.id, article.categoryId, 4),
    storiesOfKind(["video"], 1),
  ]);
  const firstHidden = showAll ? undefined : shown[FIRST_PAGE];
  if (firstHidden) shown.length = FIRST_PAGE;
  const latestId = stats.latestId;
  const lastAt = stats.lastAt && stats.lastAt > article.updatedAt ? stats.lastAt : article.updatedAt;
  const storyUrl = `/${category?.slug ?? "news"}/${article.slug}`;
  const pageUrl = siteUrl(`/live/${article.slug}`);
  const video = videos[0];

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <header className="max-w-[820px]">
        <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-bold">
          <LiveBadge size="md" />
          {category && (
            <Link href={`/${category.slug}`} className="text-ink hover:underline">
              {category.name}
            </Link>
          )}
          <span className="font-semibold text-muted">
            Updated <time dateTime={lastAt.toISOString()}>{formatTime(lastAt)}</time>
          </span>
        </div>
        <h1 className="headline mt-3.5 text-[30px] leading-[1.12] tracking-[-0.01em] md:text-[44px] md:leading-[1.08] md:tracking-[-0.015em]">{article.title}</h1>
        {article.summary && <p className="mt-3.5 text-lg leading-normal text-ink-2">{article.summary}</p>}
        <p className="mt-3 text-sm text-muted">
          Reporting by{" "}
          <Link href={`/author/${author.slug}`} className="font-bold text-ink hover:underline">
            {author.name}
          </Link>
          {" · "}
          <Link href={storyUrl} className="font-bold text-ink hover:underline">
            Read the full story
          </Link>
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-12 lg:flex-row lg:items-start">
        <section id="updates" aria-label="Updates" className="min-w-0 max-w-[760px] scroll-mt-4 lg:flex-[999_1_560px]">
          {article.body.trim() && (
            <div className="border-t-2 border-ink pb-2 pt-3.5">
              <h2 className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.1em] text-brand">What we know</h2>
              <div className="live-summary text-base leading-[1.55] [&_li+li]:mt-1.5 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-[18px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(whatWeKnow(article.body)) }} />
            </div>
          )}
          <div className="mt-5">
            <LiveRefresh articleId={article.id} latestId={latestId} />
          </div>
          {shown.length === 0 && <p className="mt-6 text-muted">The first update will appear here soon.</p>}
          <ol className="mt-3">
            {shown.map((u) => (
              <li key={u.id} id={`update-${u.id}`} className="flex scroll-mt-4 flex-col gap-2 border-t border-line py-6 md:flex-row md:gap-5">
                <div className="flex flex-none gap-2 md:w-[84px] md:flex-col md:gap-1">
                  <time dateTime={u.createdAt.toISOString()} className="text-sm font-extrabold">
                    {formatTime(u.createdAt)}
                  </time>
                  <span className="text-xs leading-5 text-muted">{timeAgo(u.createdAt)}</span>
                </div>
                <article className="flex min-w-0 flex-1 flex-col gap-2.5">
                  {u.isPinned && <span className="text-[11px] font-extrabold tracking-[0.08em] text-teal">PINNED</span>}
                  {u.title && <h3 className="headline text-[22px] leading-[1.25]">{u.title}</h3>}
                  <div className="article-body !text-lg [&>*+*]:!mt-3" dangerouslySetInnerHTML={{ __html: renderMarkdown(u.body) }} />
                  <div className="flex gap-3.5 text-[13px] text-muted">
                    {u.author && <span>{u.author}</span>}
                    <CopyLinkButton url={`${pageUrl}#update-${u.id}`} />
                  </div>
                </article>
              </li>
            ))}
          </ol>
          {firstHidden && (
            <div className="mt-4 flex justify-center">
              <Link href={`/live/${article.slug}?all=1#update-${firstHidden.id}`} className="inline-flex h-[46px] items-center border border-ink px-7 text-[15px] font-bold text-ink hover:bg-ink hover:text-white">
                Show earlier updates
              </Link>
            </div>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-7 lg:max-w-[340px] lg:flex-[1_1_300px]">
          {video && (
            <Link href={storyHref(video)} className="story-link group flex flex-col gap-2">
              {video.heroImage && (
                <span className="relative block">
                  <StoryImage story={video} sizes="(min-width: 1024px) 340px, 100vw" />
                  <Duration story={video} />
                </span>
              )}
              <span className="kicker block">Video</span>
              <span className="story-title headline text-lg leading-[1.28]">{video.title}</span>
            </Link>
          )}
          {related.length > 0 && (
            <div>
              <SectionTitle>Related coverage</SectionTitle>
              {related.map((r) => (
                <Link key={r.id} href={storyHref(r)} className="story-title headline block border-b border-line py-[13px] text-base leading-[1.3]">
                  {r.title}
                </Link>
              ))}
            </div>
          )}
          <AdSlot />
        </aside>
      </div>
    </div>
  );
}

/** The live page summary box shows the story's "What to know" points when it has them, otherwise its opening paragraph. */
function whatWeKnow(body: string) {
  const box = body.match(/^> \*\*What to know\*\*\s*\n((?:>.*\n?)*)/im);
  if (box) return box[1].replace(/^> ?/gm, "").trim();
  return body.trim().split(/\n\s*\n/)[0];
}
