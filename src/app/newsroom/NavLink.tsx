"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("whitespace-nowrap rounded px-3 py-2 text-sm", active ? "bg-white/15 font-bold" : "text-white/80 hover:bg-white/10")}
    >
      {label}
    </Link>
  );
}
