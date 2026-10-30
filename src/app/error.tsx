"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Shown when a newsroom or sign-in page fails. Reader pages have their own, inside the site header. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-mist px-4 py-12 text-center">
      <h1 className="text-[22px] font-extrabold">Something went wrong</h1>
      <p className="max-w-[440px] text-sm text-muted">
        We’ve been told about the problem. Your work is saved up to your last save. Try again, or reload the page.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="h-11 bg-teal px-[18px] text-sm font-bold text-white hover:bg-teal-hover">
          Try again
        </button>
        <Link href="/" className="inline-flex h-11 items-center border border-ink px-[18px] text-sm font-bold text-ink hover:no-underline">
          Homepage
        </Link>
      </div>
      {error.digest && <p className="text-xs text-muted">Error reference: {error.digest}</p>}
    </main>
  );
}
