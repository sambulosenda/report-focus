import type { Status } from "@/db/schema";
import { cn } from "@/lib/utils";

export function PageHeader({ title, children, description }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-white px-6 py-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

const STATUS_STYLE: Record<Status | "scheduled", string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-sky-100 text-sky-800",
  archived: "bg-zinc-200 text-zinc-600",
};

const STATUS_LABEL: Record<Status | "scheduled", string> = {
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
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_STYLE[s])}>{STATUS_LABEL[s]}</span>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-lg border border-line bg-white", className)}>{children}</section>;
}

export const inputClass = "w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10";
export const btnPrimary = "rounded bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy-2 disabled:opacity-50";
export const btnBrand = "rounded bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50";
export const btnGhost = "rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-navy disabled:opacity-50";
