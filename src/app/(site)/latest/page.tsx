import type { Metadata } from "next";
import { Pager } from "@/components/StoryGrid";
import { RowStory } from "@/components/Story";
import { latestStories } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Latest News" };
const PER_PAGE = 25;

export default async function LatestPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const stories = await latestStories(PER_PAGE + 1, (page - 1) * PER_PAGE);
  const shown = stories.slice(0, PER_PAGE);

  // Group by day, newest first.
  const groups = new Map<string, typeof shown>();
  for (const s of shown) {
    const key = formatDate(s.publishedAt);
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="headline flex items-center gap-3 text-4xl">
        <span className="live-dot inline-block h-3 w-3 rounded-full bg-brand" /> Latest news
      </h1>
      {[...groups].map(([day, list]) => (
        <section key={day} className="mt-8">
          <h2 className="mb-4 border-b-2 border-ink pb-1 text-sm font-black uppercase tracking-wider">{day}</h2>
          <div className="flex flex-col gap-6">
            {list.map((s) => (
              <RowStory key={s.id} story={s} />
            ))}
          </div>
        </section>
      ))}
      <Pager base="/latest" page={page} hasNext={stories.length > PER_PAGE} />
    </div>
  );
}
