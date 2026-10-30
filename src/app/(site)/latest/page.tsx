import type { Metadata } from "next";
import { RiverStory } from "@/components/Story";
import { LoadMore } from "@/components/StoryGrid";
import { latestStories } from "@/lib/queries";
import { formatDate, formatTime, pageParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Latest News" };
const PER_PAGE = 25;

export default async function LatestPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageParam((await searchParams).page);
  const stories = await latestStories(PER_PAGE + 1, (page - 1) * PER_PAGE);
  const shown = stories.slice(0, PER_PAGE);

  // Group by day, newest first.
  const groups = new Map<string, typeof shown>();
  for (const s of shown) {
    const key = formatDate(s.publishedAt);
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return (
    <div className="mx-auto max-w-[880px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <h1 className="flex items-center gap-3 border-b-[3px] border-ink pb-[18px] text-[32px] font-extrabold leading-none tracking-[-0.02em] md:text-[44px]">
        <span aria-hidden className="live-dot h-3 w-3 rounded-full bg-brand" /> Latest news
      </h1>
      {[...groups].map(([day, list]) => (
        <section key={day} className="mt-8" aria-label={day}>
          <h2 className="inline-block border-b-[3px] border-brand pb-2 text-xl font-extrabold">{day}</h2>
          <ol className="mt-2">
            {list.map((s) => (
              <li key={s.id} className="border-b border-line">
                <RiverStory story={s} time={formatTime(s.publishedAt)} imageWidth="md:w-[160px]" />
              </li>
            ))}
          </ol>
        </section>
      ))}
      <LoadMore base="/latest" page={page} hasNext={stories.length > PER_PAGE} />
    </div>
  );
}
