import Link from "next/link";
import { BreakingBanner } from "@/components/BreakingBanner";
import { PlayIcon } from "@/components/icons";
import { NewsletterBand } from "@/components/NewsletterForm";
import {
  Kicker,
  NumberedList,
  OpinionStory,
  SectionBlock,
  SectionTitle,
  StackStory,
  StoryImage,
  ThumbStory,
  VideoCard,
  storyHref,
} from "@/components/Story";
import {
  breakingStory,
  currentLiveStory,
  featuredStories,
  latestStories,
  mostRead,
  navCategories,
  relatedStories,
  sectionRails,
  storiesOfKind,
  trendingTags,
} from "@/lib/queries";
import { initials } from "@/lib/utils";

export default async function HomePage() {
  const [breaking, featured, latest, popular, cats, videos, opinion, live, chips] = await Promise.all([
    breakingStory(),
    featuredStories(5),
    latestStories(30),
    mostRead(8),
    navCategories(),
    storiesOfKind(["video"], 5),
    storiesOfKind(["analysis", "opinion", "explainer"], 3),
    currentLiveStory(),
    trendingTags(6),
  ]);

  const lead = featured[0] ?? latest[0];
  if (!lead) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="headline text-3xl">No stories yet</h1>
        <p className="mt-3 text-muted">Published stories will appear here.</p>
      </div>
    );
  }

  const used = new Set([lead.id]);
  const take = <T extends { id: number }>(list: T[], n: number) => {
    const out = list.filter((s) => !used.has(s.id)).slice(0, n);
    out.forEach((s) => used.add(s.id));
    return out;
  };
  const textStories = latest.filter((s) => s.kind !== "video");
  const bullets = await relatedStories(lead.id, lead.categoryId, 2, "video");
  bullets.forEach((s) => used.add(s.id));
  const stack = take(textStories, 5);
  const top = popular.slice(0, 8);

  const rails = await sectionRails(cats, 4);
  const blocks = cats.map((c) => ({ cat: c, stories: rails.get(c.id) ?? [] })).filter((b) => b.stories.length > 0);
  const row1 = blocks.slice(0, 3);
  const row2 = blocks.slice(3);

  return (
    <>
      {breaking && <BreakingBanner story={breaking} />}

      {chips.length > 0 && (
        <div className="border-b border-line">
          <div className="no-scrollbar mx-auto flex max-w-[1280px] items-center gap-2.5 overflow-x-auto px-4 py-2.5 md:flex-wrap md:overflow-visible md:px-6">
            <span className="mr-1.5 flex-none text-xs font-extrabold uppercase tracking-[0.08em] text-ink">Full coverage</span>
            {chips.map((c) => (
              <Link
                key={c.slug}
                href={`/tag/${encodeURIComponent(c.slug)}`}
                className="flex-none rounded-full border border-line-2 px-[13px] py-[7px] text-[13px] font-semibold capitalize text-ink hover:border-ink"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-4 pb-0 pt-4 md:px-6 md:pb-[52px] md:pt-[26px]">
        <h1 className="sr-only">Report Focus News: top stories</h1>
        <section className="grid gap-y-5 md:grid-cols-2 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)_minmax(0,1.1fr)]">
          {/* Lead story */}
          <article className="flex min-w-0 flex-col gap-2.5 md:col-span-2 md:gap-3 lg:order-2 lg:col-span-1">
            <Link href={storyHref(lead)} aria-label={lead.title} className="relative -mx-4 block md:mx-0">
              <StoryImage story={lead} priority rounded={false} className="md:rounded" />
              {lead.kind === "live" && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded bg-brand px-2 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white md:left-3.5 md:top-3.5 md:px-2.5 md:py-[5px] md:text-xs">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-white md:h-[7px] md:w-[7px]" aria-hidden />
                  LIVE
                </span>
              )}
            </Link>
            <Kicker story={lead} />
            <h2>
              <Link href={storyHref(lead)} className="story-title headline block text-[30px] leading-[1.12] tracking-[-0.01em] md:text-[44px] md:leading-[1.06] md:tracking-[-0.015em]">
                {lead.title}
              </Link>
            </h2>
            {lead.summary && <p className="text-base leading-normal text-ink-2 md:text-lg md:leading-[1.55]">{lead.summary}</p>}
            {bullets.length > 0 && (
              <ul className="flex flex-col md:mt-0.5 md:gap-[9px]">
                {bullets.map((b) => (
                  <li key={b.id} className="border-t border-line md:border-0">
                    <Link href={storyHref(b)} className="story-title headline flex min-h-11 items-center gap-2.5 text-base leading-[1.28] md:min-h-0 md:items-start md:text-lg md:leading-[1.3]">
                      <span aria-hidden className="font-sans text-xs text-brand md:leading-[1.9]">■</span>
                      {b.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {live && (
              <Link href={storyHref(live)} className="group mt-2 flex items-center gap-3 rounded-md bg-teal px-3.5 py-3 text-white hover:no-underline md:mt-1.5 md:flex-wrap md:gap-x-[18px] md:gap-y-2.5 md:px-4 md:py-3.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-[18px]">
                  <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap text-[11px] font-extrabold tracking-[0.06em] text-on-teal-pink md:text-xs">
                    <span className="live-dot h-[7px] w-[7px] rounded-full bg-[#ff5a6e]" aria-hidden />
                    REPORT FOCUS LIVE
                  </span>
                  <span className="truncate text-sm font-semibold md:font-normal">
                    <b className="hidden md:inline">Now: </b>
                    <span className="md:hidden">Now: </span>
                    {live.title}
                  </span>
                </span>
                <span className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-extrabold text-teal group-hover:bg-on-teal md:ml-auto md:text-sm md:text-ink">
                  <PlayIcon color="#004666" />
                  Follow
                </span>
              </Link>
            )}
          </article>

          {/* Headline stack: text on desktop, thumbnails on phones */}
          <div className="min-w-0 lg:order-1">
            <div className="md:hidden">
              {stack.slice(0, 4).map((s) => (
                <ThumbStory key={s.id} story={s} />
              ))}
            </div>
            <div className="hidden flex-col md:flex">
              {stack.map((s, i) => (
                <StackStory key={s.id} story={s} withImage={i === 0} size={i === 0 ? "lg" : "md"} />
              ))}
            </div>
          </div>

          {/* Top stories */}
          <aside className="min-w-0 lg:order-3" aria-labelledby="top-stories">
            <SectionTitle id="top-stories">Top Stories</SectionTitle>
            <NumberedList stories={top} />
          </aside>
        </section>
      </div>

      {videos.length > 0 && (
        <section aria-labelledby="trending-videos" className="mt-7 bg-teal pb-6 pt-[22px] text-white md:mt-0 md:pb-10 md:pt-9">
          <div className="mx-auto max-w-[1280px] md:px-6">
            <div className="mb-3.5 flex items-baseline justify-between px-4 md:mb-[18px] md:px-0">
              <h2 id="trending-videos" className="text-xl font-extrabold md:text-[22px]">Trending videos</h2>
              <Link href="/video" className="inline-flex min-h-11 items-center text-[13px] font-bold text-white hover:underline md:min-h-0 md:text-sm">
                See all <span aria-hidden className="ml-1 hidden md:inline">→</span>
              </Link>
            </div>
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 md:grid md:grid-cols-[repeat(auto-fit,minmax(210px,1fr))] md:gap-5 md:overflow-visible md:px-0">
              {videos.map((v) => (
                <VideoCard key={v.id} story={v} className="w-[240px] flex-none md:w-auto" />
              ))}
            </div>
          </div>
        </section>
      )}

      {row1.length > 0 && (
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-2 pt-6 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:px-6 md:pt-12">
          {row1.map(({ cat, stories }) => (
            <SectionBlock key={cat.id} title={cat.name} href={`/${cat.slug}`} stories={stories} />
          ))}
        </div>
      )}

      {opinion.length > 0 && (
        <section aria-labelledby="opinion" className="mx-auto mt-6 max-w-[1280px] px-4 md:mt-10 md:px-6">
          <div className="flex flex-col gap-1.5 rounded-[10px] bg-cream px-4 py-[18px] md:gap-5 md:p-7">
            <h2 id="opinion" className="text-xl font-extrabold text-ink">Analysis &amp; Opinion</h2>
            <div className="flex flex-col md:grid md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] md:gap-6">
              {opinion.map((o) => (
                <OpinionStory key={o.id} story={o} initials={initials(o.author.name)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {row2.length > 0 && (
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-6 pt-6 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:px-6 md:pb-16 md:pt-10">
          {row2.map(({ cat, stories }) => (
            <SectionBlock key={cat.id} title={cat.name} href={`/${cat.slug}`} stories={stories} layout="thumb" />
          ))}
        </div>
      )}

      <div className="mb-7 md:mb-0">
        <NewsletterBand />
      </div>
    </>
  );
}
