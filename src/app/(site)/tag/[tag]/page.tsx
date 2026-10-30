import type { Metadata } from "next";
import { CardStory, RiverStory } from "@/components/Story";
import { storiesByTag } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent((await params).tag);
  return { title: tag.charAt(0).toUpperCase() + tag.slice(1) };
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent((await params).tag);
  const stories = await storiesByTag(tag);
  const [first, second, ...rest] = stories;
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <header className="border-b-[3px] border-ink pb-[18px]">
        <p className="kicker">Full coverage</p>
        <h1 className="mt-2 text-[32px] font-extrabold capitalize leading-none tracking-[-0.02em] md:text-[44px]">{tag}</h1>
      </header>
      {stories.length === 0 && <p className="py-10 text-muted">No stories on this topic yet.</p>}
      {first && (
        <div className="mt-7 grid gap-8 md:grid-cols-2">
          <CardStory story={first} ratio="16/9" showKicker />
          {second && <CardStory story={second} ratio="16/9" showKicker />}
        </div>
      )}
      {rest.length > 0 && (
        <ol className="mt-8 max-w-[880px]">
          {rest.map((s) => (
            <li key={s.id} className="border-b border-line">
              <RiverStory story={s} meta={timeAgo(s.publishedAt)} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
