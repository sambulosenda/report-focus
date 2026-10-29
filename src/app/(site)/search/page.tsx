import type { Metadata } from "next";
import { RowStory } from "@/components/Story";
import { searchStories } from "@/lib/queries";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const results = q ? await searchStories(q) : [];
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="headline text-4xl">Search</h1>
      <form className="mt-5 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search for a story, topic or place"
          className="flex-1 rounded border border-line px-4 py-3 text-lg outline-none focus:border-navy"
        />
        <button className="rounded bg-navy px-6 font-bold text-white hover:bg-navy-2">Search</button>
      </form>
      {q && (
        <p className="mt-6 text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
        </p>
      )}
      <div className="mt-6 flex flex-col gap-6">
        {results.map((s) => (
          <RowStory key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}
