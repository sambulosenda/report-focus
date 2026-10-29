import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { Avatar } from "@/components/Avatar";
import { LogoMark } from "@/components/Logo";
import { hasRole, requireUser } from "@/lib/auth";
import { NavLink } from "./NavLink";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Newsroom", template: "%s · Newsroom" }, robots: { index: false } };

export default async function NewsroomLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const links = [
    { href: "/newsroom", label: "Dashboard", exact: true },
    { href: "/newsroom/articles", label: "Stories" },
    { href: "/newsroom/media", label: "Image library" },
    ...(hasRole(user, "editor") ? [{ href: "/newsroom/categories", label: "Sections" }] : []),
    ...(hasRole(user, "admin") ? [{ href: "/newsroom/users", label: "Staff" }] : []),
    { href: "/newsroom/profile", label: "My profile" },
  ];

  return (
    <div className="min-h-screen bg-mist md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-navy text-white md:sticky md:top-0 md:h-screen">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <Link href="/newsroom" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="text-sm font-black leading-tight tracking-wide">REPORT FOCUS<br /><span className="font-semibold text-white/60">Newsroom</span></span>
          </Link>
        </div>
        <div className="px-4">
          <Link href="/newsroom/articles/new" className="block rounded bg-brand py-2.5 text-center text-sm font-bold hover:bg-brand-dark">
            + Write a story
          </Link>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
          <Link href="/" target="_blank" className="whitespace-nowrap rounded px-3 py-2 text-sm text-white/70 hover:bg-white/10">
            View site ↗
          </Link>
        </nav>
        <div className="mt-auto hidden border-t border-white/10 p-4 md:block">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} url={user.avatarUrl} size={36} />
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-white/60">{user.role}</p>
            </div>
          </div>
          <form action={logout} className="mt-3">
            <button className="text-xs font-semibold text-white/70 hover:text-white">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
