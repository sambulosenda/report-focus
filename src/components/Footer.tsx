import Link from "next/link";
import { navCategories } from "@/lib/queries";
import { Logo } from "./Logo";

export async function Footer() {
  const cats = await navCategories();
  return (
    <footer className="mt-16 bg-navy text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_2fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Independent reporting on the stories that shape your world. Fast when it breaks, thorough when it matters.
          </p>
          <div className="mt-5 flex gap-3 text-sm">
            <Link href="/feed.xml" className="rounded-full border border-white/30 px-3 py-1 hover:bg-white/10">RSS feed</Link>
            <Link href="/latest" className="rounded-full border border-white/30 px-3 py-1 hover:bg-white/10">Latest news</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Sections</h2>
            <ul className="space-y-2 text-sm">
              {cats.slice(0, Math.ceil(cats.length / 2)).map((c) => (
                <li key={c.id}><Link href={`/${c.slug}`} className="hover:text-white">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">&nbsp;</h2>
            <ul className="space-y-2 text-sm">
              {cats.slice(Math.ceil(cats.length / 2)).map((c) => (
                <li key={c.id}><Link href={`/${c.slug}`} className="hover:text-white">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Report Focus</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/search" className="hover:text-white">Search</Link></li>
              <li><Link href="/login" className="hover:text-white">Newsroom sign in</Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/60">© {new Date().getFullYear()} Report Focus. All rights reserved.</p>
      </div>
    </footer>
  );
}
