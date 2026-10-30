import Link from "next/link";
import { donateUrl } from "@/lib/ads";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Asks readers to back the newsroom. Shown only when DONATE_URL is set. */
export function SupportCard({ className }: { className?: string }) {
  if (!donateUrl()) return null;
  return (
    <section aria-labelledby="support-us" className={cn("border-t-2 border-ink pt-3", className)}>
      <h2 id="support-us" className="headline text-[22px] leading-tight md:text-[26px]">Support independent journalism</h2>
      <p className="mt-2 max-w-[560px] text-[15px] leading-normal text-ink-2 md:text-base">
        {SITE_NAME} is free to read. Contributions from readers pay for the reporting, so it can stay that way.
      </p>
      <Link href="/support" className="mt-4 inline-flex h-11 items-center bg-teal px-5 text-[15px] font-bold text-white hover:bg-teal-hover hover:no-underline">
        Support us
      </Link>
    </section>
  );
}
