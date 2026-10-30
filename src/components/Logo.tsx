import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";

/** The masthead: "Report Focus News" set in Playfair Display SemiBold. Text only, no symbol. */
export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return <span className={cn("masthead", dark ? "text-white" : "text-ink", className)}>{SITE_NAME}</span>;
}
