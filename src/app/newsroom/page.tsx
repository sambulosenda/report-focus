import Link from "next/link";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { Card, PageHeader, StatusBadge, btnBrand } from "@/components/newsroom/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";

async function storyList(where: ReturnType<typeof and>, limit = 8) {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
      editorNote: articles.editorNote,
      author: users.name,
      category: categories.name,
    })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId))
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .where(where)
    .orderBy(desc(articles.updatedAt))
    .limit(limit);
}

type Row = Awaited<ReturnType<typeof storyList>>[number];

function StoryRows({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <p className="px-5 py-6 text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/newsroom/articles/${r.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-mist">
            <div className="min-w-0">
              <p className="truncate font-semibold">{r.title}</p>
              <p className="text-xs text-muted">
                {r.author} · {r.category ?? "No section"} · edited {timeAgo(r.updatedAt)}
              </p>
              {r.editorNote && r.status === "draft" && <p className="mt-1 text-xs font-semibold text-amber-700">Editor note: {r.editorNote}</p>}
            </div>
            <StatusBadge article={r} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const editor = hasRole(user, "editor");
  const { denied } = await searchParams;
  const dayAgo = new Date(Date.now() - 864e5);

  const [mine, review, recent, [stats]] = await Promise.all([
    storyList(and(eq(articles.authorId, user.id), sql`${articles.status} in ('draft','review')`)),
    editor ? storyList(and(eq(articles.status, "review"))) : Promise.resolve([]),
    storyList(and(eq(articles.status, "published")), 6),
    db
      .select({
        published24h: sql<number>`sum(case when ${articles.status} = 'published' and ${articles.publishedAt} >= ${Math.floor(dayAgo.getTime() / 1000)} then 1 else 0 end)`,
        inReview: sql<number>`sum(case when ${articles.status} = 'review' then 1 else 0 end)`,
        drafts: sql<number>`sum(case when ${articles.status} = 'draft' then 1 else 0 end)`,
        total: count(),
      })
      .from(articles)
      .where(editor ? undefined : eq(articles.authorId, user.id)),
  ]);
  const [{ views }] = await db
    .select({ views: sql<number>`coalesce(sum(${articles.views}), 0)` })
    .from(articles)
    .where(and(eq(articles.status, "published"), gte(articles.publishedAt, new Date(Date.now() - 7 * 864e5)), editor ? undefined : eq(articles.authorId, user.id)));

  const tiles = [
    { label: "Published in 24h", value: stats.published24h ?? 0 },
    { label: "Waiting for review", value: stats.inReview ?? 0 },
    { label: "Drafts", value: stats.drafts ?? 0 },
    { label: "Views this week", value: Number(views).toLocaleString() },
  ];

  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}`} description={editor ? "Here’s what’s happening across the newsroom." : "Here’s what’s happening with your stories."}>
        <Link href="/newsroom/articles/new" className={btnBrand}>+ Write a story</Link>
      </PageHeader>
      <div className="space-y-6 p-6">
        {denied && <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">You don’t have access to that page.</p>}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <Card key={t.label} className="p-5">
              <p className="text-3xl font-black">{t.value}</p>
              <p className="mt-1 text-sm text-muted">{t.label}</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {editor && (
            <Card>
              <h2 className="border-b border-line px-5 py-3 font-bold">Review queue</h2>
              <StoryRows rows={review} empty="Nothing waiting for review." />
            </Card>
          )}
          <Card>
            <h2 className="border-b border-line px-5 py-3 font-bold">My drafts and submissions</h2>
            <StoryRows rows={mine} empty="No drafts. Start a new story." />
          </Card>
          <Card>
            <h2 className="border-b border-line px-5 py-3 font-bold">Recently published</h2>
            <StoryRows rows={recent} empty="Nothing published yet." />
          </Card>
        </div>
      </div>
    </>
  );
}
