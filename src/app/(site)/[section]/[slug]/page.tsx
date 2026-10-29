import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ShareButtons } from "@/components/ShareButtons";
import { CardStory, TextStory } from "@/components/Story";
import { renderMarkdown } from "@/lib/markdown";
import { incrementViews, mostRead, publicArticle, relatedStories } from "@/lib/queries";
import { formatDateTime, readingTime, siteUrl, timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ section: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await publicArticle((await params).slug);
  if (!row) return {};
  const { article, category, author } = row;
  const url = `/${category?.slug ?? "news"}/${article.slug}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url,
      images: article.heroImage ? [{ url: article.heroImage }] : undefined,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [author.name],
      section: category?.name,
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.summary },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { section, slug } = await params;
  const row = await publicArticle(slug);
  if (!row) notFound();
  const { article, category, author } = row;
  const canonicalSection = category?.slug ?? "news";
  if (section !== canonicalSection) permanentRedirect(`/${canonicalSection}/${article.slug}`);

  after(() => incrementViews(article.id));

  const [related, popular] = await Promise.all([relatedStories(article.id, article.categoryId), mostRead(5)]);
  const url = siteUrl(`/${canonicalSection}/${article.slug}`);
  const updated = article.publishedAt && article.updatedAt.getTime() - article.publishedAt.getTime() > 10 * 60e3;
  const tags = article.tags.split(",").map((t) => t.trim()).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: article.heroImage ? [article.heroImage] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: [{ "@type": "Person", name: author.name, url: siteUrl(`/author/${author.slug}`) }],
    publisher: { "@type": "NewsMediaOrganization", name: "Report Focus", url: siteUrl() },
    mainEntityOfPage: url,
    articleSection: category?.name,
  };

  return (
    <article className="mx-auto max-w-7xl px-4 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide">
          {article.isBreaking && (
            <span className="flex items-center gap-1.5 rounded-sm bg-brand px-2 py-0.5 text-xs text-white">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" /> Breaking
            </span>
          )}
          {category && (
            <Link href={`/${category.slug}`} style={{ color: category.color }} className="hover:underline">
              {category.name}
            </Link>
          )}
        </div>
        <h1 className="headline mt-3 text-4xl md:text-5xl">{article.title}</h1>
        {article.summary && <p className="mt-4 text-xl leading-relaxed text-muted">{article.summary}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
          <div className="flex items-center gap-3">
            <Avatar name={author.name} url={author.avatarUrl} size={44} />
            <div className="text-sm">
              <p>
                By{" "}
                <Link href={`/author/${author.slug}`} className="font-bold hover:underline">
                  {author.name}
                </Link>
                {author.title && <span className="text-muted">, {author.title}</span>}
              </p>
              <p className="text-muted">
                <time dateTime={article.publishedAt?.toISOString()}>{formatDateTime(article.publishedAt)}</time>
                {updated && <> · Updated {timeAgo(article.updatedAt)}</>} · {readingTime(article.body)} min read
              </p>
            </div>
          </div>
          <ShareButtons url={url} title={article.title} />
        </div>
      </div>

      {article.heroImage && (
        <figure className="mx-auto mt-8 max-w-5xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.heroImage} alt={article.heroCaption ?? ""} className="w-full rounded object-cover" />
          {article.heroCaption && <figcaption className="mt-2 text-sm text-muted">{article.heroCaption}</figcaption>}
        </figure>
      )}

      <div className="mx-auto mt-10 grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="mx-auto w-full max-w-3xl lg:mx-0 lg:ml-auto">
          <div className="article-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
          {tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t}>
                  <Link href={`/tag/${encodeURIComponent(t.toLowerCase())}`} className="rounded-full bg-mist px-3 py-1 text-sm font-semibold hover:bg-line">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10 rounded-lg border border-line bg-mist p-5 text-sm">
            <p className="font-bold">About the author</p>
            <p className="mt-1 text-muted">{author.bio ?? `${author.name} reports for Report Focus.`}</p>
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <h2 className="border-b-2 border-ink pb-2 text-sm font-black uppercase tracking-wider">Most read</h2>
            <ol className="divide-y divide-line">
              {popular.map((s, i) => (
                <li key={s.id}>
                  <TextStory story={s} index={i} />
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl border-t-2 border-ink pt-6">
          <h2 className="mb-6 text-xl font-black uppercase">More from {category?.name ?? "Report Focus"}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((s) => (
              <CardStory key={s.id} story={s} size="sm" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
