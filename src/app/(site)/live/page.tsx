import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RiverStory, SectionTitle } from "@/components/Story";
import { currentLiveStory, latestStories, storiesOfKind } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Live" };

/** "Live" in the nav: open the current live story, or list recent live coverage when nothing is live. */
export default async function LivePage() {
  const live = await currentLiveStory();
  if (live) redirect(`/live/${live.slug}`);
  const [past, latest] = await Promise.all([storiesOfKind(["live"], 10), latestStories(10)]);
  const list = past.length ? past : latest;
  return (
    <div className="mx-auto max-w-[880px] px-4 pb-16 pt-8 md:px-6 md:pt-10">
      <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.02em] md:text-[44px]">Live</h1>
      <p className="mt-3 text-base text-ink-2 md:text-lg">Nothing is live right now. {past.length ? "Catch up on recent live coverage." : "Here is the latest news."}</p>
      <SectionTitle className="mt-8">{past.length ? "Recent live coverage" : "Latest news"}</SectionTitle>
      <ol className="mt-2">
        {list.map((s) => (
          <li key={s.id} className="border-b border-line">
            <RiverStory story={s} meta={timeAgo(s.publishedAt)} imageWidth="md:w-[160px]" />
          </li>
        ))}
      </ol>
    </div>
  );
}
