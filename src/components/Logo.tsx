import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect width="40" height="40" rx="9" fill="#d0142c" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle cx="20" cy="20" r="4" fill="#fff" />
      <path d="M20 3.5v6M20 30.5v6M3.5 20h6M30.5 20h6" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      <span className={cn("leading-none", dark ? "text-white" : "text-navy")}>
        <span className="block text-[1.35rem] font-black tracking-tight">REPORT</span>
        <span className="block text-[0.72rem] font-bold tracking-[0.42em] text-brand">FOCUS</span>
      </span>
    </span>
  );
}
