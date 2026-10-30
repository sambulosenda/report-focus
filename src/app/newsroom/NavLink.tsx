"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, label, count, exact }: { href: string; label: string; count?: number; exact?: boolean }) {
  const path = usePathname();
  const have = useSearchParams();
  const [base, query = ""] = href.split("?");
  const want = new URLSearchParams(query);
  const sameQuery = [...new Set([...want.keys(), ...have.keys()])].every((k) => k === "page" || want.get(k) === have.get(k));
  // Filter links are active only on their own filter; pages below a section (like one story) light up the plain link.
  const active = exact ? path === base : (path === base && sameQuery) || (!query && path.startsWith(`${base}/`));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("flex h-10 items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold", active ? "bg-teal-hover text-white" : "text-on-teal hover:bg-white/10")}
    >
      {label}
      {!!count && <span className="ml-auto pl-2 text-xs text-on-teal-muted">{count}</span>}
    </Link>
  );
}
