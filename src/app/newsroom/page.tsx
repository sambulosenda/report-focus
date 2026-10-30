import Link from "next/link";
import { and, desc, eq, gt, gte, lte, sql, type SQL } from "drizzle-orm";
import { clearBreakingBanner, setBreaking } from "@/actions/articles";
import { emailBreakingAlert } from "@/actions/newsletter";
import { db } from "@/db";
import { articles, categories, emailSends, users } from "@/db/schema";
import { ActionForm } from "@/components/newsroom/ActionForm";
import { ConfirmButton } from "@/components/newsroom/ConfirmButton";
import { Card, StatusBadge, SwitchButton, btnBrand, displayStatus } from "@/components/newsroom/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { BREAKING, subscriberCount } from "@/lib/newsletters";
import { breakingStory } from "@/lib/queries";
import { cn, dayOffset, formatDate, formatTime, timeAgo } from "@/lib/utils";

const TABS = [
  { value: "", label: "All" },
  { value: "review", label: "In review" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
] as const;

type Tab = (typeof TABS)[number]["value"];

function tabWhere(tab: Tab, now: Date): SQL | undefined {
  if (tab === "scheduled") return and(eq(articles.status, "published"), gt(articles.publishedAt, now));
  if (tab === "published") return and(eq(articles.status, "published"), lte(articles.publishedAt, now));
  if (tab === "draft" || tab === "review") return eq(articles.status, tab);
  return sql`${articles.status} != 'archived'`;
}

function greeting(now: Date) {
  const h = Number(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: process.env.SITE_TIMEZONE ?? "America/New_York" }));
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}

/** Short, editor-friendly time: today shows the clock, tomorrow says so, older shows how long ago. */
function when(d: Date | null, now: Date) {
  if (!d) return "";
  if (d > now) {
    const days = dayOffset(d, now);
    return `${days === 0 ? "Today" : days === 1 ? "Tomorrow" : formatDate(d).replace(/, \d{4}$/, "")} ${formatTime(d)}`;
  }
  return now.getTime() - d.getTime() < 12 * 3600e3 ? formatTime(d) : timeAgo(d);
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string; tab?: string; section?: string }> }) {
  const user = await requireUser();
  const editor = hasRole(user, "editor");
  const sp = await searchParams;
  const tab = (TABS.some((t) => t.value === sp.tab) ? sp.tab : "") as Tab;
  const sectionId = Number(sp.section) || undefined;
  const now = new Date();
  const dayStart = new Date(now.getTime() - 24 * 3600e3);
  const scope = editor ? undefined : eq(articles.authorId, user.id);
  const inSection = sectionId ? eq(articles.categoryId, sectionId) : undefined;

  const [rows, cats, [counts], [stats], upNext, activity, breaking] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        status: articles.status,
        isBreaking: articles.isBreaking,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
        author: users.name,
        authorId: articles.authorId,
        section: categories.name,
      })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .leftJoin(categories, eq(categories.id, articles.categoryId))
      .where(and(tabWhere(tab, now), scope, inSection))
      .orderBy(desc(articles.updatedAt))
      .limit(25),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.sortOrder),
    db
      .select({
        all: sql<number>`sum(case when ${articles.status} != 'archived' then 1 else 0 end)`,
        review: sql<number>`sum(case when ${articles.status} = 'review' then 1 else 0 end)`,
        draft: sql<number>`sum(case when ${articles.status} = 'draft' then 1 else 0 end)`,
        scheduled: sql<number>`sum(case when ${articles.status} = 'published' and ${articles.publishedAt} > ${Math.floor(now.getTime() / 1000)} then 1 else 0 end)`,
        published: sql<number>`sum(case when ${articles.status} = 'published' and ${articles.publishedAt} <= ${Math.floor(now.getTime() / 1000)} then 1 else 0 end)`,
      })
      .from(articles)
      .where(and(scope, inSection)),
    db
      .select({
        publishedToday: sql<number>`sum(case when ${articles.status} = 'published' and ${articles.publishedAt} between ${Math.floor(dayStart.getTime() / 1000)} and ${Math.floor(now.getTime() / 1000)} then 1 else 0 end)`,
        breakingToday: sql<number>`sum(case when ${articles.isBreaking} and ${articles.status} = 'published' and ${articles.publishedAt} between ${Math.floor(dayStart.getTime() / 1000)} and ${Math.floor(now.getTime() / 1000)} then 1 else 0 end)`,
        oldestReview: sql<number | null>`min(case when ${articles.status} = 'review' then ${articles.updatedAt} end)`,
        nextScheduled: sql<number | null>`min(case when ${articles.status} = 'published' and ${articles.publishedAt} > ${Math.floor(now.getTime() / 1000)} then ${articles.publishedAt} end)`,
      })
      .from(articles)
      .where(and(scope, inSection)),
    db
      .select({ id: articles.id, title: articles.title, publishedAt: articles.publishedAt, author: users.name, section: categories.name })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .leftJoin(categories, eq(categories.id, articles.categoryId))
      .where(and(eq(articles.status, "published"), gt(articles.publishedAt, now), scope))
      .orderBy(articles.publishedAt)
      .limit(4),
    db
      .select({ id: articles.id, title: articles.title, status: articles.status, publishedAt: articles.publishedAt, updatedAt: articles.updatedAt, author: users.name })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(and(gte(articles.updatedAt, new Date(now.getTime() - 7 * 864e5)), scope))
      .orderBy(desc(articles.updatedAt))
      .limit(5),
    editor ? breakingStory() : Promise.resolve(null),
  ]);

  const [alertSent, alertReaders] = breaking
    ? await Promise.all([
        db.select().from(emailSends).where(and(eq(emailSends.list, BREAKING), eq(emailSends.articleId, breaking.id))).get(),
        subscriberCount(BREAKING),
      ])
    : [undefined, 0];

  const n = (v: number | null | undefined) => Number(v ?? 0);
  const reviewCount = n(counts.review);
  const tabCount: Record<Tab, number> = { "": n(counts.all), review: reviewCount, draft: n(counts.draft), scheduled: n(counts.scheduled), published: n(counts.published) };
  const tiles = [
    { label: "Awaiting review", value: reviewCount, note: stats.oldestReview ? `Oldest sent ${timeAgo(new Date(stats.oldestReview * 1000)).toLowerCase()}` : "Queue is clear" },
    { label: "Scheduled", value: n(counts.scheduled), note: stats.nextScheduled ? `Next at ${when(new Date(stats.nextScheduled * 1000), now)}` : "Nothing scheduled" },
    { label: "Published in 24 hours", value: n(stats.publishedToday), note: n(stats.breakingToday) ? `${n(stats.breakingToday)} marked breaking` : "None marked breaking" },
    { label: "Drafts", value: n(counts.draft), note: editor ? "Across the newsroom" : "Yours" },
  ];
  const href = (patch: { tab?: string; section?: string }) => {
    const p = new URLSearchParams();
    const merged = { tab: tab || undefined, section: sectionId ? String(sectionId) : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/newsroom?${s}` : "/newsroom";
  };
  const action = (r: (typeof rows)[number]) => {
    const s = displayStatus(r);
    if (s === "review") return editor ? "Review" : "Edit";
    if (s === "published") return editor ? "Update" : "View";
    return "Edit";
  };
  const verb = (a: (typeof activity)[number]) =>
    a.status === "review" ? "sent for review" : a.status === "published" ? (a.publishedAt && a.publishedAt > now ? "scheduled" : "published") : a.status === "archived" ? "archived" : "edited";

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-[22px] px-4 pb-12 pt-6 md:px-8 md:pt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">
            Good {greeting(now)}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {editor
              ? reviewCount === 1
                ? "1 story is waiting for your review."
                : `${reviewCount} stories are waiting for your review.`
              : `You have ${n(counts.draft)} draft${n(counts.draft) === 1 ? "" : "s"} and ${reviewCount} with the editors.`}
          </p>
        </div>
        <Link href="/" target="_blank" className="text-sm font-bold text-ink hover:underline">
          View live site ↗
        </Link>
      </div>

      {sp.denied && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">You don’t have access to that page.</p>}

      {editor && (
        <section
          aria-label="Breaking banner"
          className={cn("flex flex-wrap items-center gap-x-5 gap-y-3.5 rounded-[10px] border px-[18px] py-4", breaking ? "border-[#f3b7bf] bg-[#fdecee]" : "border-line bg-white")}
        >
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
            <span className={cn("text-xs font-extrabold tracking-[0.08em]", breaking ? "text-brand" : "text-muted")}>
              {breaking ? "● BREAKING BANNER IS LIVE" : "BREAKING BANNER IS OFF"}
            </span>
            <span className="text-[15px] font-bold">
              {breaking ? breaking.title : "Switch on Breaking for a published story below to show the red banner across the site."}
            </span>
          </div>
          {breaking &&
            (alertSent ? (
              <p className="text-sm font-semibold text-ink-2">
                Alert emailed at {formatTime(alertSent.createdAt)} to {alertSent.recipients.toLocaleString()} reader{alertSent.recipients === 1 ? "" : "s"}
              </p>
            ) : alertReaders > 0 ? (
              <ActionForm action={emailBreakingAlert} className="flex flex-col items-start">
                <input type="hidden" name="id" value={breaking.id} />
                <ConfirmButton
                  className={btnBrand}
                  message={`Email “${breaking.title}” to ${alertReaders.toLocaleString()} breaking-news subscriber${alertReaders === 1 ? "" : "s"}? This can't be undone.`}
                >
                  Email alert to {alertReaders.toLocaleString()} reader{alertReaders === 1 ? "" : "s"}
                </ConfirmButton>
              </ActionForm>
            ) : (
              <p className="text-sm text-muted">No one has signed up for breaking-news emails yet.</p>
            ))}
          {breaking && (
            <form action={clearBreakingBanner}>
              <SwitchButton on label="Show breaking banner on the site" />
            </form>
          )}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[10px] border border-line bg-white px-[18px] py-4">
            <p className="text-[13px] font-semibold text-muted">{t.label}</p>
            <p className="mt-1.5 text-[28px] font-extrabold tabular">{t.value}</p>
            <p className="mt-0.5 text-xs text-muted">{t.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[22px] xl:flex-row xl:items-start">
        <Card className="min-w-0 overflow-hidden xl:flex-[999_1_600px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-[18px] py-3.5">
            <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <Link
                  key={t.value}
                  href={href({ tab: t.value || undefined })}
                  aria-current={tab === t.value ? "page" : undefined}
                  className={cn("inline-flex h-[38px] items-center rounded-lg border px-3.5 text-sm font-bold", tab === t.value ? "border-teal bg-teal text-white" : "border-line-2 bg-white text-ink-2 hover:border-ink")}
                >
                  {t.label} <span className="ml-1.5 tabular">{tabCount[t.value]}</span>
                </Link>
              ))}
            </nav>
            <form className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              {tab && <input type="hidden" name="tab" value={tab} />}
              <label htmlFor="dash-section">Section</label>
              <select id="dash-section" name="section" defaultValue={sectionId ?? ""} className="h-[38px] rounded-lg border border-[#9ca3af] bg-white px-2.5 text-sm text-ink">
                <option value="">All sections</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button className="h-[38px] rounded-lg border border-line-2 px-3 text-sm font-bold hover:border-ink">Apply</button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs tracking-[0.04em] text-muted">
                  <th className="px-[18px] py-3 font-bold">STORY</th>
                  <th className="px-2.5 py-3 font-bold">AUTHOR</th>
                  <th className="px-2.5 py-3 font-bold">STATUS</th>
                  <th className="px-2.5 py-3 font-bold">UPDATED</th>
                  {editor && <th className="px-2.5 py-3 font-bold">BREAKING</th>}
                  <th className="px-[18px] py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-[18px] py-8 text-center text-muted">
                      No stories match these filters.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const s = displayStatus(r);
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <td className="max-w-[380px] px-[18px] py-[13px]">
                        <Link href={`/newsroom/articles/${r.id}`} className="font-bold leading-[1.4] text-ink hover:underline">
                          {r.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">{r.section ?? "No section"}</p>
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-[13px] text-ink-2">{r.author}</td>
                      <td className="px-2.5 py-[13px]">
                        <StatusBadge article={r} />
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-[13px] text-muted tabular">{when(s === "scheduled" ? r.publishedAt : r.updatedAt, now)}</td>
                      {editor && (
                        <td className="px-2.5 py-[13px]">
                          {r.status === "published" ? (
                            <form action={setBreaking}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="on" value={r.isBreaking ? "0" : "1"} />
                              <SwitchButton on={r.isBreaking} label={`Breaking: ${r.title}`} />
                            </form>
                          ) : (
                            <span className="text-xs text-muted" title="Only published stories can carry the banner">—</span>
                          )}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-[18px] py-[13px] text-right">
                        <Link href={`/newsroom/articles/${r.id}`} className="font-bold text-ink hover:underline">
                          {action(r)}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <aside className="flex min-w-0 flex-col gap-[22px] xl:flex-[1_1_280px]">
          <Card className="p-[18px]">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-extrabold">Up next</h2>
              <Link href="/newsroom/articles?status=scheduled" className="text-[13px] font-bold text-teal hover:underline">
                Schedule →
              </Link>
            </div>
            {upNext.length === 0 && <p className="text-sm text-muted">Nothing is scheduled.</p>}
            <ol className="flex flex-col">
              {upNext.map((s) => (
                <li key={s.id} className="flex gap-3 border-t border-[#f0f1f3] py-2.5">
                  <span className="w-[70px] flex-none text-[13px] font-extrabold tabular">{when(s.publishedAt, now)}</span>
                  <span className="flex flex-col gap-0.5">
                    <Link href={`/newsroom/articles/${s.id}`} className="text-sm font-semibold leading-[1.35] hover:underline">
                      {s.title}
                    </Link>
                    <span className="text-xs text-muted">
                      {s.section ?? "No section"} · {s.author}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-[18px]">
            <h2 className="mb-3 text-base font-extrabold">Recent activity</h2>
            {activity.length === 0 && <p className="text-sm text-muted">No changes this week.</p>}
            <ul className="flex flex-col gap-2.5 text-[13px] leading-[1.45] text-ink-2">
              {activity.map((a) => (
                <li key={a.id}>
                  “<Link href={`/newsroom/articles/${a.id}`} className="font-bold text-ink hover:underline">{a.title}</Link>” {verb(a)} · {a.author} ·{" "}
                  <time dateTime={a.updatedAt.toISOString()}>{when(a.updatedAt, now)}</time>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
