import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, like, lte, gt, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { Card, PageHeader, StatusBadge, btnBrand, btnGhost, inputClass } from "@/components/newsroom/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { formatDateTime, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Stories" };

const FILTERS = [
  { value: "", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "review", label: "In review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

type Search = { status?: string; q?: string; section?: string; mine?: string; deleted?: string; error?: string };

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const editor = hasRole(user, "editor");
  // Journalists see their own stories plus everything already public.
  const mine = sp.mine === "1" || !editor;

  const where: (SQL | undefined)[] = [];
  const now = new Date();
  if (sp.status === "scheduled") where.push(and(eq(articles.status, "published"), gt(articles.publishedAt, now)));
  else if (sp.status === "published") where.push(and(eq(articles.status, "published"), lte(articles.publishedAt, now)));
  else if (sp.status === "draft" || sp.status === "review" || sp.status === "archived") where.push(eq(articles.status, sp.status));
  if (sp.section) where.push(eq(articles.categoryId, Number(sp.section)));
  if (sp.q) where.push(like(articles.title, `%${sp.q.replace(/[%_]/g, "")}%`));
  if (mine) where.push(editor ? eq(articles.authorId, user.id) : or(eq(articles.authorId, user.id), eq(articles.status, "published")));

  const [rows, cats] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        status: articles.status,
        isBreaking: articles.isBreaking,
        isFeatured: articles.isFeatured,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
        views: articles.views,
        authorId: articles.authorId,
        author: users.name,
        category: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .leftJoin(categories, eq(categories.id, articles.categoryId))
      .where(and(...where))
      .orderBy(desc(articles.updatedAt))
      .limit(200),
    db.select().from(categories).orderBy(categories.sortOrder),
  ]);

  const qs = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { status: sp.status, q: sp.q, section: sp.section, mine: sp.mine, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageHeader title="Stories" description={editor ? "Every story in the newsroom." : "Your stories, plus everything published."}>
        <Link href="/newsroom/articles/new" className={btnBrand}>+ New story</Link>
      </PageHeader>
      <div className="space-y-4 p-6">
        {sp.deleted && <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Story deleted.</p>}
        {sp.error && <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-dark">You can’t delete that story.</p>}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/newsroom/articles${qs({ status: f.value || undefined })}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${(sp.status ?? "") === f.value ? "bg-navy text-white" : "bg-white text-ink hover:bg-line"}`}
            >
              {f.label}
            </Link>
          ))}
          {editor && (
            <Link href={`/newsroom/articles${qs({ mine: sp.mine === "1" ? undefined : "1" })}`} className={`ml-auto rounded-full px-3 py-1.5 text-sm font-semibold ${sp.mine === "1" ? "bg-brand text-white" : "bg-white hover:bg-line"}`}>
              Only mine
            </Link>
          )}
        </div>
        <form className="flex flex-wrap gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.mine && <input type="hidden" name="mine" value={sp.mine} />}
          <input name="q" defaultValue={sp.q} placeholder="Search headlines" className={`${inputClass} max-w-xs`} />
          <select name="section" defaultValue={sp.section ?? ""} className={`${inputClass} max-w-[200px]`}>
            <option value="">All sections</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className={btnGhost}>Filter</button>
        </form>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Headline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No stories match.</td></tr>
              )}
              {rows.map((r) => {
                const editable = editor || (r.authorId === user.id && (r.status === "draft" || r.status === "review"));
                return (
                  <tr key={r.id} className="hover:bg-mist/60">
                    <td className="max-w-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.isBreaking && <span className="rounded-sm bg-brand px-1.5 text-[10px] font-black uppercase text-white">Breaking</span>}
                        {r.isFeatured && <span className="rounded-sm bg-navy px-1.5 text-[10px] font-black uppercase text-white">Top</span>}
                        {editable ? (
                          <Link href={`/newsroom/articles/${r.id}`} className="font-semibold hover:underline">{r.title}</Link>
                        ) : (
                          <span className="font-semibold">{r.title}</span>
                        )}
                      </div>
                      {r.status === "published" && (
                        <Link href={`/${r.categorySlug ?? "news"}/${r.slug}`} target="_blank" className="text-xs text-muted hover:underline">View on site ↗</Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge article={r} />
                      {r.status === "published" && r.publishedAt && r.publishedAt > now && (
                        <p className="mt-1 text-xs text-muted">{formatDateTime(r.publishedAt)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.category ?? "—"}</td>
                    <td className="px-4 py-3">{r.author}</td>
                    <td className="px-4 py-3 text-muted">{timeAgo(r.updatedAt)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.views.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
