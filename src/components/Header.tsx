import Link from "next/link";
import { navCategories, latestStories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { Ticker } from "./Ticker";

export async function Header() {
  const [cats, latest, user] = await Promise.all([navCategories(), latestStories(8), getCurrentUser()]);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <MobileMenu categories={cats.map((c) => ({ name: c.name, slug: c.slug }))} />
          <Link href="/" aria-label="Report Focus home">
            <Logo />
          </Link>
        </div>
        <p className="hidden text-sm text-muted md:block">{today}</p>
        <div className="flex items-center gap-2">
          <form action="/search" className="hidden sm:block" role="search">
            <label className="sr-only" htmlFor="site-search">Search</label>
            <input
              id="site-search"
              name="q"
              placeholder="Search news"
              className="w-44 rounded-full border border-line bg-mist px-4 py-1.5 text-sm outline-none focus:border-navy focus:bg-white lg:w-56"
            />
          </form>
          <Link
            href={user ? "/newsroom" : "/login"}
            className="rounded-full border border-navy px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-navy hover:bg-navy hover:text-white"
          >
            {user ? "Newsroom" : "Sign in"}
          </Link>
        </div>
      </div>
      <nav aria-label="Sections" className="bg-navy">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-2 text-sm font-semibold text-white [scrollbar-width:none]">
          <li>
            <Link href="/" className="block whitespace-nowrap px-3 py-3 hover:bg-navy-2">Home</Link>
          </li>
          <li>
            <Link href="/latest" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-3 hover:bg-navy-2">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-brand" /> Latest
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={`/${c.slug}`} className="block whitespace-nowrap px-3 py-3 hover:bg-navy-2">{c.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {latest.length > 0 && <Ticker items={latest.map((s) => ({ title: s.title, href: `/${s.category?.slug ?? "news"}/${s.slug}` }))} />}
    </header>
  );
}
