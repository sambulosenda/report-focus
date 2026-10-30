import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Avatar } from "@/components/Avatar";
import { MailIcon } from "@/components/icons";
import { RiverStory, SectionTitle } from "@/components/Story";
import { LoadMore } from "@/components/StoryGrid";
import { storiesByAuthor } from "@/lib/queries";
import { absoluteUrl, authorLd, authorMetaDescription, isDeskByline, isUnconfirmedAuthor, ldJson, NOT_FOUND_METADATA, orgId, pagedPath, pageMeta } from "@/lib/seo";
import { formatDate, pageParam, siteUrl } from "@/lib/utils";

const PER_PAGE = 12;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

const getAuthor = async (slug: string) =>
  db.select({ id: users.id, name: users.name, slug: users.slug, title: users.title, bio: users.bio, avatarUrl: users.avatarUrl }).from(users).where(eq(users.slug, slug)).get();

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const a = await getAuthor((await params).slug);
  if (!a) return NOT_FOUND_METADATA;
  return pageMeta({
    title: a.name,
    description: authorMetaDescription(a.name, a.bio),
    path: pagedPath(`/author/${a.slug}`, pageParam((await searchParams).page)),
    // A desk byline is not a person. Username sign-ups stay out of search until the owner confirms them.
    noindex: isDeskByline(a.name) || isUnconfirmedAuthor(a.slug),
    openGraph: { type: "profile" },
  });
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const author = await getAuthor((await params).slug);
  if (!author) notFound();
  const page = pageParam((await searchParams).page);
  const stories = await storiesByAuthor(author.id, PER_PAGE + 1, (page - 1) * PER_PAGE);
  const first = author.name.split(" ")[0];
  const person = authorLd(author);
  // A profile page for each named writer, so search engines can tie their stories to them.
  const ld =
    person["@type"] === "Person" && !isUnconfirmedAuthor(author.slug)
      ? {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: siteUrl(`/author/${author.slug}`),
          mainEntity: {
            ...person,
            jobTitle: author.title ?? undefined,
            description: author.bio ?? undefined,
            image: author.avatarUrl ? absoluteUrl(author.avatarUrl) : undefined,
            worksFor: { "@id": orgId() },
          },
        }
      : null;

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-8 md:px-6 md:pb-[72px] md:pt-12">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />}
      <section aria-label={`About ${author.name}`} className="flex flex-col items-start gap-5 border-b-[3px] border-ink pb-8 sm:flex-row sm:gap-7">
        {author.avatarUrl && (
          <>
            <span className="hidden sm:block">
              <Avatar name={author.name} url={author.avatarUrl} size={128} />
            </span>
            <span className="sm:hidden">
              <Avatar name={author.name} url={author.avatarUrl} size={88} />
            </span>
          </>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[44px]">{author.name}</h1>
          {author.title && <p className="text-base font-semibold text-ink-2">{author.title}</p>}
          {author.bio && <p className="mt-1 max-w-[640px] font-serif text-lg leading-[1.6]">{author.bio}</p>}
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Link href="/tips" className="inline-flex h-10 items-center gap-2 border border-line-2 px-4 text-sm font-bold hover:border-ink">
              <MailIcon size={16} className="text-teal" />
              Send a tip
            </Link>
          </div>
        </div>
      </section>
      <section className="mt-8" aria-labelledby="latest-from">
        <SectionTitle id="latest-from">Latest from {first}</SectionTitle>
        {stories.length === 0 && <p className="mt-4 text-muted">No published stories yet.</p>}
        <ol className="mt-2">
          {stories.slice(0, PER_PAGE).map((s) => (
            <li key={s.id} className="border-b border-line">
              <RiverStory story={s} meta={<time dateTime={s.publishedAt?.toISOString()}>{formatDate(s.publishedAt)}</time>} imageWidth="md:w-[200px]" imageFirst />
            </li>
          ))}
        </ol>
        <LoadMore base={`/author/${author.slug}`} page={page} hasNext={stories.length > PER_PAGE} />
      </section>
    </div>
  );
}
