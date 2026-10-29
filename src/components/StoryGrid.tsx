import { CardStory, RowStory } from "./Story";
import type { StoryCard } from "@/lib/queries";
import Link from "next/link";

export function StoryGrid({ stories }: { stories: StoryCard[] }) {
  if (stories.length === 0) return <p className="py-10 text-muted">No stories here yet.</p>;
  const [first, ...rest] = stories;
  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2">
        <CardStory story={first} />
        <div className="flex flex-col gap-5">
          {rest.slice(0, 4).map((s) => (
            <RowStory key={s.id} story={s} />
          ))}
        </div>
      </div>
      {rest.length > 4 && (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(4).map((s) => (
            <CardStory key={s.id} story={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Pager({ base, page, hasNext }: { base: string; page: number; hasNext: boolean }) {
  if (page <= 1 && !hasNext) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <nav className="mt-12 flex justify-between text-sm font-bold" aria-label="Pagination">
      {page > 1 ? <Link href={`${base}${sep}page=${page - 1}`} className="text-brand hover:underline">← Newer stories</Link> : <span />}
      {hasNext && <Link href={`${base}${sep}page=${page + 1}`} className="text-brand hover:underline">Older stories →</Link>}
    </nav>
  );
}
