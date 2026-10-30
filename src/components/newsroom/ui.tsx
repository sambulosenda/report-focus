import type { Status } from "@/db/schema";
import { cn } from "@/lib/utils";

export function PageHeader({ title, children, description }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 px-4 pb-1 pt-6 md:px-8 md:pt-7">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.01em] text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

const STATUS_STYLE: Record<Status | "scheduled", string> = {
  draft: "bg-[#f3f4f6] text-[#374151]",
  review: "bg-highlight text-[#7a4a00]",
  published: "bg-teal text-white",
  scheduled: "bg-[#d5eaf0] text-teal",
  archived: "bg-[#e5e7eb] text-[#4b5563]",
};

export const STATUS_LABEL: Record<Status | "scheduled", string> = {
  draft: "Draft",
  review: "In review",
  published: "Published",
  scheduled: "Scheduled",
  archived: "Archived",
};

export function displayStatus(a: { status: Status; publishedAt: Date | null }) {
  return a.status === "published" && a.publishedAt && a.publishedAt > new Date() ? "scheduled" : a.status;
}

export function StatusBadge({ article }: { article: { status: Status; publishedAt: Date | null } }) {
  const s = displayStatus(article);
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", STATUS_STYLE[s])}>{STATUS_LABEL[s]}</span>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-[10px] border border-line bg-white", className)}>{children}</section>;
}

/** On/off switch. Put it inside a form to make it submit, or give it onClick in a client component. */
export function SwitchButton({ on, label, className, ...rest }: { on: boolean; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      {...rest}
      className={cn("inline-flex h-[26px] w-11 flex-none items-center rounded-full p-[3px] transition-colors disabled:opacity-50", on ? "justify-end bg-brand" : "justify-start bg-[#9ca3af]", className)}
    >
      <span className="block h-5 w-5 rounded-full bg-white shadow-sm" />
    </button>
  );
}

export const inputClass = "w-full rounded-lg border border-[#9ca3af] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15";
export const labelClass = "block text-xs font-extrabold uppercase tracking-[0.06em] text-muted";
export const btnPrimary = "inline-flex h-10 items-center justify-center rounded-lg bg-teal px-4 text-sm font-bold text-white hover:bg-teal-hover disabled:opacity-50";
export const btnBrand = "inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-extrabold text-white hover:bg-brand-dark disabled:opacity-50";
export const btnGhost = "inline-flex h-10 items-center justify-center rounded-lg border border-line-2 bg-white px-4 text-sm font-bold text-ink hover:border-ink disabled:opacity-50";
