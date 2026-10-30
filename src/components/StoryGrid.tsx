import Link from "next/link";

/** "Load more stories" for paged lists. Links to the next page, so it works without JavaScript. */
export function LoadMore({ base, page, hasNext }: { base: string; page: number; hasNext: boolean }) {
  if (!hasNext && page <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <nav aria-label="More stories" className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {page > 1 && (
        <Link href={page === 2 ? base : `${base}${sep}page=${page - 1}`} className="inline-flex h-[46px] items-center rounded-full border border-line-2 px-6 text-[15px] font-bold text-ink hover:border-ink">
          ← Newer stories
        </Link>
      )}
      {hasNext && (
        <Link href={`${base}${sep}page=${page + 1}`} className="inline-flex h-[46px] items-center rounded-full border border-ink px-7 text-[15px] font-bold text-ink hover:bg-ink hover:text-white">
          Load more stories
        </Link>
      )}
    </nav>
  );
}

/** Numbered pages for search results. */
export function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  const href = (p: number) => (p === 1 ? base : `${base}${sep}page=${p}`);
  const start = Math.max(1, Math.min(page - 1, pages - 2));
  const nums = Array.from({ length: Math.min(3, pages) }, (_, i) => start + i);
  const circle = "inline-flex h-11 w-11 items-center justify-center rounded-full font-bold";
  return (
    <nav aria-label="Pages" className="mt-7 flex justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} className="inline-flex h-11 items-center rounded-full border border-line-2 px-[18px] font-bold hover:border-ink">
          Previous
        </Link>
      )}
      {nums.map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined} className={n === page ? `${circle} bg-ink text-white` : `${circle} border border-line-2 hover:border-ink`}>
          {n}
        </Link>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className="inline-flex h-11 items-center rounded-full border border-line-2 px-[18px] font-bold hover:border-ink">
          Next
        </Link>
      )}
    </nav>
  );
}
