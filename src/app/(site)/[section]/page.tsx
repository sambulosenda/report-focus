import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { NewsletterCard } from "@/components/NewsletterForm";
import { Kicker, NumberedList, RiverStory, SectionTitle, StoryImage, storyHref } from "@/components/Story";
import { LoadMore } from "@/components/StoryGrid";
import { redirectLegacyOrNotFound } from "@/lib/legacy-redirect";
import { renderMarkdown } from "@/lib/markdown";
import { pagedPath, pageMeta } from "@/lib/seo";
import { categoryBySlug, mostRead, storiesInCategory, trendingTags } from "@/lib/queries";
import { INFO_PAGES, SITE_NAME } from "@/lib/site";
import { dayOffset, formatDate, formatTime, pageParam, timeAgo } from "@/lib/utils";

const RIVER = 10;

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = (await params).section;
  const cat = await categoryBySlug(slug);
  if (cat) {
    const path = pagedPath(`/${cat.slug}`, pageParam((await searchParams).page));
    return pageMeta({ title: `${cat.name} News`, description: cat.description ?? `The latest ${cat.name} news from ${SITE_NAME}.`, path });
  }
  const info = INFO_PAGES[slug];
  return info ? pageMeta({ title: info.title, description: info.description, path: `/${slug}` }) : {};
}

/** River time column: clock time today, "Yesterday", then the date, by the site's calendar. */
function riverTime(d: Date | null) {
  if (!d) return "";
  const days = dayOffset(d);
  if (days >= 0) return formatTime(d);
  if (days === -1) return "Yesterday";
  return formatDate(d).replace(/, \d{4}$/, "");
}

export default async function SectionPage({ params, searchParams }: Props) {
  const slug = (await params).section;
  const cat = await categoryBySlug(slug);
  if (!cat) {
    const info = INFO_PAGES[slug];
    if (!info) return redirectLegacyOrNotFound(`/${slug}`);
    return <InfoPage {...info} />;
  }

  const page = pageParam((await searchParams).page);
  const topCount = page === 1 ? 3 : 0;
  const [stories, topics, popular] = await Promise.all([
    storiesInCategory(cat.id, topCount + RIVER + 1, page === 1 ? 0 : 3 + (page - 1) * RIVER),
    trendingTags(5, cat.id),
    mostRead(5, cat.id),
  ]);
  const top = stories.slice(0, topCount);
  // Lead with the newest story that has a picture, so a text-only story doesn't leave a hole beside the stack.
  const withArt = top.findIndex((s) => s.heroImage);
  if (withArt > 0) top.unshift(...top.splice(withArt, 1));
  const [lead, ...second] = top;
  const river = stories.slice(topCount, topCount + RIVER);
  const hasNext = stories.length > topCount + RIVER;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-[18px]">
        <div>
          <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.02em] md:text-[44px]">{cat.name}</h1>
          {cat.description && <p className="mt-2.5 max-w-2xl text-base text-ink-2">{cat.description}</p>}
          {topics.length > 0 && (
            <nav aria-label={`${cat.name} topics`} className="mt-3 flex flex-wrap gap-x-5">
              {topics.map((t) => (
                <Link key={t.slug} href={`/tag/${encodeURIComponent(t.slug)}`} className="inline-flex h-[34px] items-center text-[13px] font-bold capitalize hover:underline">
                  {t.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <a href="#section-newsletter" className="inline-flex h-10 items-center border border-teal px-4 text-sm font-bold text-teal hover:bg-teal hover:text-white">
          Follow {cat.name}
        </a>
      </header>

      {stories.length === 0 && <p className="py-10 text-muted">No stories in {cat.name} yet.</p>}

      {lead && (
        <section aria-label={`Top ${cat.name} stories`} className="mt-7 flex flex-col gap-8 lg:flex-row">
          <Link href={storyHref(lead)} className="story-link group flex min-w-0 flex-col gap-3 lg:flex-[2_1_560px]">
            <StoryImage story={lead} priority sizes="(min-width: 1280px) 820px, (min-width: 1024px) 64vw, 100vw" />
            <Kicker story={lead} />
            <span className="story-title headline text-[26px] leading-[1.12] tracking-[-0.01em] md:text-[32px] md:leading-[1.1]">{lead.title}</span>
            {lead.summary && <span className="text-base leading-normal text-ink-2 md:text-lg">{lead.summary}</span>}
            <span className="text-[13px] text-muted">
              By {lead.author.name} · {timeAgo(lead.publishedAt)}
            </span>
          </Link>
          {second.length > 0 && (
            <div className="flex min-w-0 flex-col gap-6 lg:flex-[1_1_300px]">
              {second.map((s) => (
                <Link key={s.id} href={storyHref(s)} className="story-link group flex flex-col gap-2">
                  <StoryImage story={s} sizes="(min-width: 1280px) 400px, (min-width: 1024px) 32vw, 100vw" />
                  <Kicker story={s} />
                  <span className="story-title headline text-[22px] leading-[1.2]">{s.title}</span>
                  <span className="text-[13px] text-muted">{timeAgo(s.publishedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:items-start">
        <section className="min-w-0 lg:flex-[999_1_560px]" aria-labelledby="latest-in">
          {river.length > 0 && (
            <>
              <SectionTitle id="latest-in">Latest in {cat.name}</SectionTitle>
              <ol className="mt-2">
                {river.map((s) => (
                  <li key={s.id} className="border-b border-line">
                    <RiverStory story={s} time={riverTime(s.publishedAt)} />
                  </li>
                ))}
              </ol>
            </>
          )}
          <LoadMore base={`/${cat.slug}`} page={page} hasNext={hasNext} />
        </section>
        <aside className="flex min-w-0 flex-col gap-8 lg:max-w-[340px] lg:flex-[1_1_300px]">
          {popular.length > 0 && (
            <div>
              <SectionTitle>Most read in {cat.name}</SectionTitle>
              <NumberedList stories={popular} />
            </div>
          )}
          <AdSlot />
          <NewsletterCard
            id="section-newsletter"
            label="Newsletter"
            title={`${cat.name} Focus`}
            text={`The day’s most important ${cat.name.toLowerCase()} stories, in five minutes. Weekdays.`}
            list={`section-${cat.slug}`}
          />
        </aside>
      </div>
    </div>
  );
}

function InfoPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[780px] px-4 pb-16 pt-8 md:px-6 md:pt-12">
      <h1 className="headline border-b-[3px] border-ink pb-[18px] text-[32px] leading-[1.1] md:text-[44px]">{title}</h1>
      <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
    </div>
  );
}
