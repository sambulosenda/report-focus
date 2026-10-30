import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Avatar } from "@/components/Avatar";
import { LiveBadge } from "@/components/LiveBadge";
import { NewsletterCard } from "@/components/NewsletterForm";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";
import { SupportCard } from "@/components/SupportCard";
import { CardStory, NumberedList, SectionTitle } from "@/components/Story";
import { VideoWatch } from "@/components/VideoWatch";
import { ViewBeacon } from "@/components/ViewBeacon";
import { KIND_LABEL } from "@/db/schema";
import { inlineAdHtml } from "@/lib/ads";
import { canOptimize } from "@/lib/images";
import { redirectLegacyOrNotFound } from "@/lib/legacy-redirect";
import { renderMarkdownWithBreaks } from "@/lib/markdown";
import { liveUpdatesFor, mostRead, publicArticle, relatedStories, storiesOfKind } from "@/lib/queries";
import { absoluteUrl, ldJson, pageMeta, publisherLd, SHARE_IMAGE } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { excerpt, formatDateTime, formatTime, readingTime, siteUrl, timeAgo } from "@/lib/utils";
import { videoEmbedUrl } from "@/lib/video";

type Props = { params: Promise<{ section: string; slug: string }> };

// No stories are built ahead of time: each is built on its first visit, then cached like every reader page.
export const generateStaticParams = () => [];

/** A story's tags as a list, without the placeholder "sample" tag. */
function storyTags(tags: string) {
  return tags.split(",").map((t) => t.trim()).filter((t) => t && t.toLowerCase() !== "sample");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await publicArticle((await params).slug);
  if (!row) return {};
  const { article, category, author } = row;
  return pageMeta({
    title: article.title,
    description: article.summary || excerpt(article.body, 160),
    path: `/${category?.slug ?? "news"}/${article.slug}`,
    image: article.heroImage ? { url: article.heroImage, alt: article.heroAlt } : null,
    openGraph:
      article.kind === "video"
        ? { type: "video.other" }
        : {
            type: "article",
            publishedTime: article.publishedAt?.toISOString(),
            modifiedTime: article.updatedAt.toISOString(),
            authors: [siteUrl(`/author/${author.slug}`)],
            section: category?.name,
            tags: storyTags(article.tags),
          },
  });
}

export default async function ArticlePage({ params }: Props) {
  const { section, slug } = await params;
  const row = await publicArticle(slug);
  if (!row) return redirectLegacyOrNotFound(`/${section}/${slug}`);
  const { article, category, author } = row;
  const canonicalSection = category?.slug ?? "news";
  if (section !== canonicalSection) permanentRedirect(`/${canonicalSection}/${article.slug}`);

  const url = siteUrl(`/${canonicalSection}/${article.slug}`);

  if (article.kind === "video") {
    const videos = (await storiesOfKind(["video"], 10)).filter((v) => v.id !== article.id);
    const moreVideos = videos.slice(5, 9);
    const embed = article.videoUrl ? videoEmbedUrl(article.videoUrl) : null;
    const videoLd = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: article.title,
      description: article.summary || article.title,
      thumbnailUrl: [absoluteUrl(article.heroImage ?? SHARE_IMAGE.url)],
      uploadDate: article.publishedAt?.toISOString(),
      duration: isoDuration(article.videoDuration),
      embedUrl: embed ?? undefined,
      contentUrl: article.videoUrl && !embed ? absoluteUrl(article.videoUrl) : undefined,
      publisher: publisherLd(),
    };
    return (
      <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(videoLd) }} />
      <ViewBeacon articleId={article.id} />
      <VideoWatch
        video={{ ...article, categoryName: category?.name }}
        upNext={videos.slice(0, 5)}
        more={moreVideos.length ? moreVideos : await relatedStories(article.id, article.categoryId, 4)}
        moreTitle={moreVideos.length ? "More videos" : `More from ${category?.name ?? SITE_NAME}`}
      />
      </>
    );
  }

  const [related, popular, updates] = await Promise.all([
    relatedStories(article.id, article.categoryId),
    mostRead(5),
    article.kind === "live" ? liveUpdatesFor(article.id) : Promise.resolve([]),
  ]);
  const lastUpdate = updates.reduce<Date | null>((d, u) => (!d || u.createdAt > d ? u.createdAt : d), null);
  const updatedAt = lastUpdate && lastUpdate > article.updatedAt ? lastUpdate : article.updatedAt;
  const updated = article.publishedAt && updatedAt.getTime() - article.publishedAt.getTime() > 10 * 60e3;
  const tags = storyTags(article.tags);
  const latestUpdates = [...updates].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": article.kind === "live" ? "LiveBlogPosting" : article.kind === "opinion" ? "OpinionNewsArticle" : article.kind === "analysis" ? "AnalysisNewsArticle" : "NewsArticle",
    headline: article.title,
    description: article.summary || excerpt(article.body, 160),
    image: [absoluteUrl(article.heroImage ?? SHARE_IMAGE.url)],
    datePublished: article.publishedAt?.toISOString(),
    dateModified: updatedAt.toISOString(),
    author: [{ "@type": "Person", name: author.name, url: siteUrl(`/author/${author.slug}`) }],
    publisher: publisherLd(),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: category?.name,
    keywords: tags.length ? tags.join(", ") : undefined,
    inLanguage: "en",
    isAccessibleForFree: true,
    ...(article.kind === "live" && { coverageStartTime: article.publishedAt?.toISOString() }),
  };

  return (
    <>
      <ReadingProgress targetId="story" />
      <ViewBeacon articleId={article.id} />
      <article id="story" className="mx-auto max-w-[1280px] px-4 pb-16 pt-[18px] md:px-6 md:pb-[72px] md:pt-9">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
        <header className="mx-auto max-w-[780px]">
          <nav aria-label="Breadcrumb" className="mb-2.5 flex flex-wrap items-center gap-2 text-xs font-bold md:mb-3.5 md:gap-2.5 md:text-[13px]">
            {article.kind === "live" && <LiveBadge />}
            {article.isBreaking && article.kind !== "live" && (
              <span className="bg-brand px-[9px] py-1 text-[11px] font-extrabold tracking-[0.08em] text-white">BREAKING</span>
            )}
            {category && (
              <Link href={`/${category.slug}`} className="text-ink hover:underline">
                {category.name}
              </Link>
            )}
            {article.kind !== "news" && article.kind !== "live" && (
              <>
                <span aria-hidden className="text-[#9ca3af]">/</span>
                <span className="uppercase tracking-[0.05em] text-brand">{KIND_LABEL[article.kind]}</span>
              </>
            )}
          </nav>
          <h1 className="headline text-[30px] leading-[1.12] tracking-[-0.01em] md:text-[48px] md:leading-[1.07] md:tracking-[-0.015em]">{article.title}</h1>
          {article.summary && <p className="mt-3 text-lg leading-normal text-ink-2 md:mt-[18px] md:text-xl">{article.summary}</p>}

          <div className="mt-4 md:mt-6 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-3.5 md:border-y md:border-line md:py-4">
            <div className="flex items-center gap-2.5 md:flex-[1_1_260px] md:gap-3">
              {author.avatarUrl && (
                <>
                  <span className="hidden md:block">
                    <Avatar name={author.name} url={author.avatarUrl} size={44} />
                  </span>
                  <span className="md:hidden">
                    <Avatar name={author.name} url={author.avatarUrl} size={40} />
                  </span>
                </>
              )}
              <div className="text-[13px] leading-[1.4] md:text-sm md:leading-[1.45]">
                <p>
                  By{" "}
                  <Link href={`/author/${author.slug}`} className="font-extrabold text-ink hover:underline">
                    {author.name}
                  </Link>
                  {author.title && <span className="hidden md:inline">, {author.title}</span>}
                </p>
                <p className="text-muted">
                  <time dateTime={article.publishedAt?.toISOString()}>{formatDateTime(article.publishedAt)}</time>
                  {updated && (
                    <>
                      {" · "}Updated <time dateTime={updatedAt.toISOString()}>{timeAgo(updatedAt)}</time>
                    </>
                  )}
                  <span className="hidden md:inline"> · {readingTime(article.body)} min read</span>
                </p>
              </div>
            </div>
            <ShareButtons url={url} title={article.title} className="mt-3 justify-between border-y border-line py-2 md:mt-0 md:justify-start md:border-0 md:py-0" />
          </div>
        </header>

        {article.heroImage && (
          <figure className="-mx-4 mt-4 md:mx-auto md:mt-[30px] md:max-w-[1080px]">
            <span className="relative block aspect-video w-full bg-mist">
              <Image
                src={article.heroImage}
                alt={article.heroAlt ?? ""}
                fill
                priority
                sizes="(min-width: 1080px) 1080px, 100vw"
                unoptimized={!canOptimize(article.heroImage)}
                className="object-cover"
              />
            </span>
            {(article.heroCaption || article.heroCredit) && (
              <figcaption className="px-4 pt-2 text-xs leading-[1.45] text-muted md:mt-2.5 md:px-0 md:pt-0 md:text-[13px]">
                {article.heroCaption}
                {article.heroCredit && <span className="text-[#6b7280]"> {article.heroCredit}</span>}
              </figcaption>
            )}
          </figure>
        )}

        <div className="mt-5 flex flex-col gap-14 md:mt-10 lg:flex-row lg:justify-center">
          <div className="min-w-0 lg:max-w-[680px] lg:flex-[999_1_560px]">
            {latestUpdates.length > 0 && (
              <section aria-labelledby="latest-updates" className="mb-5 border border-line p-3.5 md:mb-8 md:px-5 md:py-[18px]">
                <div className="mb-1.5 flex items-center justify-between md:mb-3">
                  <h2 id="latest-updates" className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand md:text-xs">
                    <span aria-hidden className="live-dot h-[7px] w-[7px] rounded-full bg-brand" />
                    Latest updates
                  </h2>
                  <Link href={`/live/${article.slug}`} className="hidden text-[13px] font-bold text-ink hover:underline md:inline">
                    All updates
                  </Link>
                </div>
                <ol>
                  {latestUpdates.map((u) => (
                    <li key={u.id} className="border-t border-[#f0f1f3]">
                      <Link href={`/live/${article.slug}#update-${u.id}`} className="flex gap-3 py-2 hover:underline md:gap-3.5 md:py-[9px]">
                        <time dateTime={u.createdAt.toISOString()} className="w-[58px] flex-none text-xs font-extrabold text-ink md:w-16 md:text-[13px] md:font-bold">
                          {formatTime(u.createdAt)}
                        </time>
                        <span className="text-sm leading-[1.45] text-ink md:text-[15px]">{u.title || u.body}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
                <Link href={`/live/${article.slug}`} className="flex min-h-11 items-center border-t border-[#f0f1f3] text-sm font-bold md:hidden">
                  See all updates
                </Link>
              </section>
            )}

            <div className="article-body" dangerouslySetInnerHTML={{ __html: renderMarkdownWithBreaks(article.body, inlineAdHtml()) }} />

            {tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1" aria-label="Topics">
                {tags.map((t) => (
                  <li key={t}>
                    <Link href={`/tag/${encodeURIComponent(t.toLowerCase())}`} className="inline-flex py-1 text-[13px] font-bold capitalize text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 flex items-start gap-4 border-t border-line pt-5">
              {author.avatarUrl && <Avatar name={author.name} url={author.avatarUrl} size={52} />}
              <div className="text-[15px] leading-normal">
                <p className="font-extrabold text-ink">{author.name}</p>
                <p className="text-muted">{author.bio ?? `${author.name} reports for ${SITE_NAME}.`}</p>
                <Link href={`/author/${author.slug}`} className="mt-1.5 inline-block text-sm font-bold text-ink underline underline-offset-4 hover:text-teal">
                  More from {author.name.split(" ")[0]}
                </Link>
              </div>
            </div>

            <SupportCard className="mt-8" />
          </div>

          <aside className="min-w-0 lg:max-w-[320px] lg:flex-[1_1_280px]">
            <div className="flex flex-col gap-7 lg:sticky lg:top-6">
              <div>
                <SectionTitle>Most Read</SectionTitle>
                <NumberedList stories={popular} numberSize="lg" />
              </div>
              <AdSlot placement="sidebar" />
              <NewsletterCard text="Five stories before 8 a.m., every weekday." />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="more-from">
            <SectionTitle id="more-from" className="mb-5">
              More from {category?.name ?? SITE_NAME}
            </SectionTitle>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((s) => (
                <CardStory key={s.id} story={s} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}

/** "4:12" or "1:02:30" as an ISO 8601 duration for search engines. */
function isoDuration(d: string | null) {
  const parts = d?.split(":").map(Number);
  if (!parts || parts.some(Number.isNaN)) return undefined;
  const [h, m, sec] = parts.length === 3 ? parts : [0, ...parts];
  return `PT${h ? `${h}H` : ""}${m}M${sec}S`;
}
