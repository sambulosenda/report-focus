"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { ChevronRightIcon, CloseIcon, MenuIcon, SearchIcon } from "./icons";

type Props = {
  sections: { label: string; href: string }[];
  live?: { title: string; href: string } | null;
  signedIn: boolean;
};

/** Full-screen section menu for phones. */
export function MobileMenu({ sections, live, signedIn }: Props) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // Close when the route changes.
  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const opener = openRef.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  const row = "flex h-[52px] items-center border-b border-line text-lg";

  return (
    <>
      <button
        ref={openRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-mist md:hidden"
      >
        <MenuIcon />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
          <div className="flex h-14 flex-none items-center justify-between border-b border-line px-1.5">
            <button ref={closeRef} type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-mist">
              <CloseIcon />
            </button>
            <Link href="/" aria-label="Report Focus News home" onClick={() => setOpen(false)}>
              <Logo className="text-2xl" />
            </Link>
            <span className="w-11" aria-hidden />
          </div>
          <form action="/search" role="search" className="flex-none p-4">
            <label htmlFor="menu-search" className="sr-only">Search news</label>
            <div className="flex h-[46px] items-center gap-2 rounded-full bg-mist px-3.5">
              <SearchIcon size={18} className="text-muted" />
              <input id="menu-search" name="q" type="search" placeholder="Search news" className="flex-1 bg-transparent text-base text-ink outline-none" />
            </div>
          </form>
          <nav aria-label="Sections" className="flex-1 overflow-y-auto px-4">
            <Link href={live?.href ?? "/live"} onClick={() => setOpen(false)} className={`${row} gap-2.5 font-extrabold text-brand`}>
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
              Follow live
              {live && <span className="ml-auto max-w-[55%] truncate text-[13px] font-semibold text-muted">{live.title}</span>}
            </Link>
            {sections.map((s) => (
              <Link key={s.href} href={s.href} onClick={() => setOpen(false)} className={`${row} font-bold text-ink`}>
                {s.label}
                <ChevronRightIcon className="ml-auto text-muted" />
              </Link>
            ))}
          </nav>
          <div className="flex flex-none flex-col gap-2.5 border-t border-line bg-white p-4">
            <Link href={signedIn ? "/newsroom" : "/login"} className="flex h-[46px] items-center justify-center rounded-full bg-teal text-[15px] font-bold text-white hover:bg-teal-hover">
              {signedIn ? "Go to the newsroom" : "Sign in"}
            </Link>
            <Link href="/newsletters" className="flex h-[46px] items-center justify-center rounded-full border border-[#9ca3af] text-[15px] font-bold text-ink">
              Get The Morning Focus newsletter
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
