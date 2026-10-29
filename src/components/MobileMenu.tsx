"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileMenu({ categories }: { categories: { name: string; slug: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-md hover:bg-mist"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 top-[60px] z-50 overflow-y-auto bg-white p-4 shadow-xl">
          <form action="/search" className="mb-4" role="search">
            <input name="q" placeholder="Search news" className="w-full rounded-full border border-line bg-mist px-4 py-2" />
          </form>
          <ul className="divide-y divide-line text-lg font-bold">
            <li><Link onClick={() => setOpen(false)} href="/" className="block py-3">Home</Link></li>
            <li><Link onClick={() => setOpen(false)} href="/latest" className="block py-3">Latest news</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link onClick={() => setOpen(false)} href={`/${c.slug}`} className="block py-3">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
