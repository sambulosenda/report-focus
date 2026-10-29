import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pager, StoryGrid } from "@/components/StoryGrid";
import { categoryBySlug, storiesInCategory } from "@/lib/queries";

const PER_PAGE = 13;

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await categoryBySlug((await params).section);
  if (!cat) return {};
  return { title: `${cat.name} News`, description: cat.description ?? `The latest ${cat.name} news from Report Focus.` };
}

export default async function SectionPage({ params, searchParams }: Props) {
  const cat = await categoryBySlug((await params).section);
  if (!cat) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const stories = await storiesInCategory(cat.id, PER_PAGE + 1, (page - 1) * PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <header className="mb-8 border-b-4 pb-4" style={{ borderColor: cat.color }}>
        <h1 className="headline text-4xl md:text-5xl">{cat.name}</h1>
        {cat.description && <p className="mt-2 max-w-2xl text-lg text-muted">{cat.description}</p>}
      </header>
      <StoryGrid stories={stories.slice(0, PER_PAGE)} />
      <Pager base={`/${cat.slug}`} page={page} hasNext={stories.length > PER_PAGE} />
    </div>
  );
}
