import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Avatar } from "@/components/Avatar";
import { RowStory } from "@/components/Story";
import { storiesByAuthor } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

const getAuthor = async (slug: string) => db.select().from(users).where(eq(users.slug, slug)).get();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAuthor((await params).slug);
  return a ? { title: a.name, description: a.bio ?? undefined } : {};
}

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthor((await params).slug);
  if (!author) notFound();
  const stories = await storiesByAuthor(author.id);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10">
      <header className="flex items-center gap-5 border-b border-line pb-8">
        <Avatar name={author.name} url={author.avatarUrl} size={88} />
        <div>
          <h1 className="headline text-3xl">{author.name}</h1>
          {author.title && <p className="mt-1 font-semibold text-brand">{author.title}</p>}
          {author.bio && <p className="mt-2 text-muted">{author.bio}</p>}
        </div>
      </header>
      <h2 className="mb-5 mt-8 text-sm font-black uppercase tracking-wider">Stories by {author.name}</h2>
      <div className="flex flex-col gap-6">
        {stories.length === 0 && <p className="text-muted">No published stories yet.</p>}
        {stories.map((s) => (
          <RowStory key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}
