import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { CardStory, RiverStory } from "@/components/Story";
import { storiesByTag } from "@/lib/queries";
import { pageMeta } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ tag: string }> };
export const generateStaticParams = () => [];

// A topic with fewer stories than this is too thin a page for Google; readers can still open it.
const MIN_INDEXED = 3;

/**
 * The stories for a tag address. Old WordPress tag links write spaces as hyphens
 * (/tag/emmerson-mnangagwa), so when the address as typed finds nothing, the spaced form is tried.
 */
const findTag = cache(async (param: string) => {
  const tag = decodeURIComponent(param);
  const stories = await storiesByTag(tag);
  if (stories.length || !tag.includes("-")) return { tag, stories, moved: false };
  const spaced = tag.replace(/-+/g, " ");
  return { tag: spaced, stories: await storiesByTag(spaced), moved: true };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag, stories } = await findTag((await params).tag);
  if (!stories.length) return {};
  const title = tag.charAt(0).toUpperCase() + tag.slice(1);
  return pageMeta({
    title,
    description: `Full coverage of ${tag} from ${SITE_NAME}.`,
    path: `/tag/${encodeURIComponent(tag.toLowerCase())}`,
    noindex: stories.length < MIN_INDEXED,
  });
}

export default async function TagPage({ params }: Props) {
  const { tag, stories, moved } = await findTag((await params).tag);
  // An empty topic page is a "soft 404" to Google, so unknown tags get the real not-found page.
  if (!stories.length) notFound();
  if (moved) permanentRedirect(`/tag/${encodeURIComponent(tag.toLowerCase())}`);
  const [first, second, ...rest] = stories;
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <header className="border-b-[3px] border-ink pb-[18px]">
        <p className="kicker">Full coverage</p>
        <h1 className="mt-2 text-[32px] font-extrabold capitalize leading-none tracking-[-0.02em] md:text-[44px]">{tag}</h1>
      </header>
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
