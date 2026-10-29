import type { Metadata } from "next";
import { StoryGrid } from "@/components/StoryGrid";
import { storiesByTag } from "@/lib/queries";

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).tag) };
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent((await params).tag);
  const stories = await storiesByTag(tag);
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-brand">Topic</p>
      <h1 className="headline mb-8 border-b-4 border-ink pb-4 text-4xl capitalize">{tag}</h1>
      <StoryGrid stories={stories} />
    </div>
  );
}
