import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, gt, sql } from "drizzle-orm";
import { logout } from "@/actions/auth";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { hasRole, requireUser } from "@/lib/auth";
import { NavLink } from "./NavLink";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Newsroom", template: "%s · Newsroom" }, robots: { index: false } };

export default async function NewsroomLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const editor = hasRole(user, "editor");
  const [counts] = await db
    .select({
      mine: sql<number>`sum(case when ${articles.authorId} = ${user.id} and ${articles.status} in ('draft','review') then 1 else 0 end)`,
      review: sql<number>`sum(case when ${articles.status} = 'review' then 1 else 0 end)`,
    })
    .from(articles);
  const [{ scheduled }] = await db
    .select({ scheduled: sql<number>`count(*)` })
    .from(articles)
    .where(and(eq(articles.status, "published"), gt(articles.publishedAt, new Date())));

  const links = [
    { href: "/newsroom", label: "Dashboard", exact: true },
    { href: "/newsroom/articles?mine=1", label: "My stories", count: Number(counts.mine ?? 0) },
    ...(editor ? [{ href: "/newsroom/articles?status=review", label: "Review queue", count: Number(counts.review ?? 0) }] : []),
    { href: "/newsroom/articles?status=scheduled", label: "Schedule", count: Number(scheduled ?? 0) },
    { href: "/newsroom/articles", label: "All stories" },
    { href: "/newsroom/media", label: "Media library" },
    ...(editor ? [{ href: "/newsroom/categories", label: "Sections" }] : []),
    ...(hasRole(user, "admin") ? [{ href: "/newsroom/users", label: "Staff" }] : []),
    { href: "/newsroom/profile", label: "My profile" },
  ];

  return (
    <div className="min-h-screen bg-mist md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 bg-teal px-4 py-4 text-white md:sticky md:top-0 md:h-screen md:gap-[22px] md:py-[22px]">
        <div className="flex items-center justify-between gap-3 px-2">
          <Link href="/newsroom" className="leading-[1.15] hover:no-underline">
            <Logo dark className="block text-xl leading-[1.1]" />
            <span className="text-xs text-on-teal-muted">Newsroom</span>
          </Link>
          <Link href="/newsroom/articles/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-extrabold hover:bg-brand-dark md:hidden">
            + New story
          </Link>
        </div>
        <Link href="/newsroom/articles/new" className="hidden h-11 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-extrabold hover:bg-brand-dark md:flex">
          <span aria-hidden className="text-lg leading-none">+</span> New story
        </Link>
        <nav aria-label="Newsroom" className="no-scrollbar -mx-1 flex gap-0.5 overflow-x-auto px-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
          <Link href="/" target="_blank" className="flex h-10 items-center whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold text-on-teal hover:bg-white/10">
            View live site ↗
          </Link>
          <form action={logout} className="md:hidden">
            <button className="flex h-10 items-center whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold text-on-teal hover:bg-white/10">Sign out</button>
          </form>
        </nav>
        <div className="mt-auto hidden items-center gap-2.5 border-t border-teal-line px-2 pt-3 md:flex">
          <span className="rounded-full bg-white">
            <Avatar name={user.name} url={user.avatarUrl} size={34} className="!bg-white !text-ink" />
          </span>
          <div className="min-w-0 flex-1 text-[13px] leading-[1.3]">
            <p className="truncate font-bold">{user.name}</p>
            <p className="capitalize text-on-teal-muted">{user.role}</p>
          </div>
          <form action={logout}>
            <button className="rounded px-1.5 py-1 text-xs font-semibold text-on-teal hover:bg-white/10 hover:text-white">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
