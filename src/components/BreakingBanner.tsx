"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";
import { CloseIcon } from "./icons";

export type BreakingAlert = { id: number; title: string; href: string; publishedAt: string };

const POLL_MS = 60_000;
const DISMISSED_KEY = "rf-breaking-dismissed";

/**
 * The red banner across the top of every reader page. It checks for a new breaking story every minute while the tab is open,
 * so readers who already have the site open see news break. Hiding it only hides that one story.
 */
export function BreakingBanner({ initial }: { initial: BreakingAlert | null }) {
  const [story, setStory] = useState(initial);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setDismissed(Number(localStorage.getItem(DISMISSED_KEY)) || null);
    } catch {}
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/breaking", { cache: "no-store" });
        if (res.ok && !stopped) setStory(await res.json());
      } catch {}
    };
    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  // Not on the breaking story itself: the reader is already there.
  if (!story || story.id === dismissed || pathname === story.href) return null;
  const ago = timeAgo(new Date(story.publishedAt));
  const hide = () => {
    setDismissed(story.id);
    try {
      localStorage.setItem(DISMISSED_KEY, String(story.id));
    } catch {}
  };

  return (
    <div role="region" aria-label="Breaking news" className="bg-brand text-white">
      <div className="mx-auto flex max-w-[1280px] items-start gap-2 pl-4 md:items-center md:pl-6">
        <Link href={story.href} className="group block min-w-0 flex-1 py-3 hover:no-underline md:flex md:flex-wrap md:items-center md:gap-x-3.5 md:gap-y-2 md:py-[11px]">
          <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em] md:text-xs">
            Breaking<span className="md:hidden" suppressHydrationWarning> · {ago}</span>
          </span>
          <span className="mt-0.5 block text-[15px] font-bold leading-snug group-hover:underline md:mt-0 md:text-base">{story.title}</span>
          <span className="hidden text-[13px] md:ml-auto md:inline" suppressHydrationWarning>{ago}</span>
        </Link>
        <button type="button" onClick={hide} aria-label="Hide this alert" className="inline-flex h-11 w-11 flex-none items-center justify-center text-white/85 hover:text-white md:mr-2">
          <CloseIcon size={18} />
        </button>
      </div>
    </div>
  );
}
