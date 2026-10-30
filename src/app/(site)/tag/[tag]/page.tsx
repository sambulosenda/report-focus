import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { CardStory, RiverStory } from "@/components/Story";
import { storiesByTag } from "@/lib/queries";
import { collectionLd, ldJson, NOT_FOUND_METADATA, pageMeta, topicMetaDescription } from "@/lib/seo";
import { TAG_INDEX_MIN, tagName, tagSlug } from "@/lib/tags";
import { siteUrl, timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ tag: string }> };
export const generateStaticParams = () => [];

/**
 * The stories for a tag address. A tag's address joins its words with hyphens (/tag/cyril-ramaphosa), as the old
 * WordPress links did, so both the hyphenated tag ("zanu-pf") and the spaced one ("cyril ramaphosa") are looked up.
 */
const findTag = cache(async (param: string) => {
  const typed = decodeURIComponent(param);
  const slug = tagSlug(typed);
  const spaced = slug.replace(/-+/g, " ");
  const [hyphened, withSpaces] = await Promise.all([storiesByTag(slug), spaced === slug ? [] : storiesByTag(spaced)]);
  const stories = [...new Map([...hyphened, ...withSpaces].map((s) => [s.id, s])).values()]
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, 30);
  // Use whichever spelling the newsroom typed for the heading.
  const tag = withSpaces.length > hyphened.length ? spaced : slug;
  return { tag, slug, stories, moved: typed !== slug };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag, slug, stories } = await findTag((await params).tag);
  if (!stories.length) return NOT_FOUND_METADATA;
  const name = tagName(tag);
  return pageMeta({
    title: `${name} News`,
    description: topicMetaDescription(name),
    path: `/tag/${encodeURIComponent(slug)}`,
    noindex: stories.length < TAG_INDEX_MIN,
  });
}

export default async function TagPage({ params }: Props) {
  const { tag, slug, stories, moved } = await findTag((await params).tag);
  // An empty topic page is a "soft 404" to Google, so unknown tags get the real not-found page.
  if (!stories.length) notFound();
  // /tag/Cyril%20Ramaphosa and other spellings go to the one address.
  if (moved) permanentRedirect(`/tag/${encodeURIComponent(slug)}`);
  const name = tagName(tag);
  const url = siteUrl(`/tag/${encodeURIComponent(slug)}`);
  const description = topicMetaDescription(name);
  const ld = collectionLd({ name, url, description, stories });
  const [first, second, ...rest] = stories;
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-6 md:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <header className="border-b-[3px] border-ink pb-[18px]">
        <p className="kicker">Full coverage</p>
        <h1 className="mt-2 text-[32px] font-extrabold leading-none tracking-[-0.02em] md:text-[44px]">{name}</h1>
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
