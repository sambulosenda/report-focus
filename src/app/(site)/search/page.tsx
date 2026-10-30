import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { SearchIcon } from "@/components/icons";
import { RiverStory } from "@/components/Story";
import { Pagination } from "@/components/StoryGrid";
import { navCategories, searchStories, type SearchSort, type SearchType } from "@/lib/queries";
import { cn, pageParam, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

const PER_PAGE = 10;
const TYPES: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "stories", label: "Stories" },
  { value: "video", label: "Video" },
  { value: "live", label: "Live" },
];

type Search = { q?: string; type?: string; sort?: string; page?: string };

/** Wraps each match of the search words in <mark>. */
function highlight(text: string, q: string) {
  const words = q.split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return text;
  const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"));
  return parts.map((p, i) => (i % 2 ? <mark key={i} className="bg-highlight text-ink">{p}</mark> : p));
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const type = (TYPES.some((t) => t.value === sp.type) ? sp.type : "all") as SearchType;
  const sort: SearchSort = sp.sort === "newest" ? "newest" : "relevance";
  const page = pageParam(sp.page);
  const [{ rows, total }, cats] = await Promise.all([
    q ? searchStories(q, { type, sort, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }) : Promise.resolve({ rows: [], total: 0 }),
    navCategories(),
  ]);
  const qs = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { q, type: type === "all" ? undefined : type, sort: sort === "relevance" ? undefined : sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/search?${p.toString()}`;
  };
  // A page past the end (an old link after stories were unpublished) goes to the first page of results.
  if (page > 1 && rows.length === 0 && total > 0) redirect(qs({}));

  return (
    <div className="mx-auto max-w-[880px] px-4 pb-16 pt-6 md:px-6 md:pb-[72px] md:pt-10">
      <h1 className="sr-only">{q ? `Search results for “${q}”` : "Search"}</h1>
      <form role="search" className="flex gap-2.5">
        {type !== "all" && <input type="hidden" name="type" value={type} />}
        {sort !== "relevance" && <input type="hidden" name="sort" value={sort} />}
        <label htmlFor="q" className="sr-only">Search Report Focus News</label>
        <div className="flex h-12 min-w-0 flex-1 items-center gap-2.5 border-2 border-ink px-4 md:h-14 md:px-[18px]">
          <SearchIcon size={20} />
          <input id="q" name="q" type="search" defaultValue={q} autoFocus={!q} placeholder="Search for a story, topic or place" className="min-w-0 flex-1 bg-transparent text-base outline-none md:text-lg" />
        </div>
        <button className="h-12 bg-teal px-5 text-base font-bold text-white hover:bg-teal-hover md:h-14 md:px-[26px]">Search</button>
      </form>

      {q && total > 0 && (
        <>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
            <p className="text-[15px] text-ink-2">
              <b className="text-ink">
                {total} result{total === 1 ? "" : "s"}
              </b>{" "}
              for “{q}”
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <nav aria-label="Result type" className="flex gap-1.5">
                {TYPES.map((t) => (
                  <Link
                    key={t.value}
                    href={qs({ type: t.value === "all" ? undefined : t.value, page: undefined })}
                    aria-current={t.value === type ? "page" : undefined}
                    className={cn("inline-flex h-9 items-center border px-3.5 text-[13px] font-bold", t.value === type ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink hover:border-ink")}
                  >
                    {t.label}
                  </Link>
                ))}
              </nav>
              <form className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-2">
                <input type="hidden" name="q" value={q} />
                {type !== "all" && <input type="hidden" name="type" value={type} />}
                <label htmlFor="sort">Sort</label>
                <AutoSubmitSelect id="sort" name="sort" defaultValue={sort} className="h-9 border border-line-2 bg-white px-2 text-[13px]">
                  <option value="relevance">Most relevant</option>
                  <option value="newest">Newest</option>
                </AutoSubmitSelect>
                <noscript>
                  <button className="h-9 border border-line-2 px-2">Apply</button>
                </noscript>
              </form>
            </div>
          </div>
          <ol>
            {rows.map((s) => (
              <li key={s.id} className="border-b border-line">
                <RiverStory story={s} title={highlight(s.title, q)} meta={`${s.author.name} · ${timeAgo(s.publishedAt)}`} imageWidth="md:w-[160px]" />
              </li>
            ))}
          </ol>
          <Pagination base={qs({ page: undefined })} page={page} pages={Math.ceil(total / PER_PAGE)} />
        </>
      )}

      {q && total === 0 && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <h2 className="headline text-[28px]">No results for “{q}”</h2>
          <p className="max-w-[460px] text-base leading-normal text-ink-2">
            {type === "all" ? "Check the spelling or try a broader word. You can also browse a section:" : "Try searching all types, or browse a section:"}
          </p>
          {type !== "all" && (
            <Link href={qs({ type: undefined })} className="font-bold text-teal hover:underline">
              Search everything for “{q}”
            </Link>
          )}
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {[{ name: "Video", slug: "video" }, ...cats].map((c) => (
              <Link key={c.slug} href={`/${c.slug}`} className="inline-flex h-9 items-center border border-line-2 px-3.5 text-[13px] font-bold hover:border-ink">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
