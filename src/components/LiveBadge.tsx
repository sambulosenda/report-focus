import { cn } from "@/lib/utils";

export function LiveBadge({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 bg-brand font-extrabold tracking-[0.08em] text-white",
        size === "md" ? "px-2.5 py-[5px] text-xs" : "px-[7px] py-[3px] text-[11px] md:px-[9px] md:py-1",
        className,
      )}
    >
      <span aria-hidden className={cn("live-dot rounded-full bg-white", size === "md" ? "h-[7px] w-[7px]" : "h-[5px] w-[5px] md:h-1.5 md:w-1.5")} />
      LIVE
    </span>
  );
}
