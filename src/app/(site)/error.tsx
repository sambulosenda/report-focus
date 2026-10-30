"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Shown inside the normal header and footer when a reader page fails to load. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 px-4 py-14 text-center md:px-6 md:py-[72px]">
      <p className="text-[13px] font-extrabold tracking-[0.12em] text-brand">SOMETHING WENT WRONG</p>
      <h1 className="headline text-[32px] leading-[1.1] tracking-[-0.015em] md:text-[44px]">This page didn’t load</h1>
      <p className="max-w-[520px] text-lg leading-[1.55] text-ink-2">
        We’ve been told about the problem. Try again in a moment, or go back to the homepage.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="h-[50px] bg-teal px-[22px] text-[15px] font-bold text-white hover:bg-teal-hover">
          Try again
        </button>
        <Link href="/" className="inline-flex h-[50px] items-center border border-ink px-[22px] text-[15px] font-bold text-ink hover:bg-ink hover:text-white hover:no-underline">
          Go to the homepage
        </Link>
      </div>
      {error.digest && <p className="mt-4 text-xs text-muted">Error reference: {error.digest}</p>}
    </div>
  );
}
