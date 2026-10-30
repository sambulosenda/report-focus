"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Section links under the masthead. The current section gets a red underline. */
export function SiteNav({ items }: { items: { label: string; href: string }[] }) {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);
  const link = "relative inline-flex items-center whitespace-nowrap py-3 text-sm font-bold md:py-2.5 md:text-[15px]";
  const underline = "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-brand";

  return (
    <nav aria-label="Sections" className="border-t border-[#f0f1f3] md:border-line">
      <ul className="no-scrollbar mx-auto flex max-w-[1280px] gap-5 overflow-x-auto px-4 md:flex-wrap md:justify-center md:gap-x-6 md:gap-y-0.5 md:overflow-visible md:px-6 md:py-1">
        <li>
          <Link href="/live" aria-current={isActive("/live") ? "page" : undefined} className={cn(link, "gap-1.5 text-brand", isActive("/live") && underline)}>
            <span className="live-dot h-[7px] w-[7px] rounded-full bg-brand md:h-2 md:w-2" aria-hidden />
            Live
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={cn(link, "text-ink", isActive(item.href) && underline)}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
