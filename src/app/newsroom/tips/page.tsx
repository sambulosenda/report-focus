import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/newsroom/ui";
import type { TipStatus } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { listTips, TIP_UNREADABLE } from "@/lib/tips";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Tips" };

const STATUS_LABEL: Record<TipStatus, string> = { new: "New", read: "Read", closed: "Closed" };
const STATUS_STYLE: Record<TipStatus, string> = {
  new: "bg-brand text-white",
  read: "bg-[#f3f4f6] text-[#374151]",
  closed: "bg-[#e5e7eb] text-[#4b5563]",
};

export default async function TipsPage() {
  const user = await requireUser("editor");
  const listed = await listTips(user);
  const rows = "tips" in listed ? (listed.tips ?? []) : [];

  return (
    <>
      <PageHeader title="Tips" description="Confidential messages from the public form. Only editors can read them." />
      <div className="p-4 md:p-6 md:px-8">
        {rows.length === 0 ? (
          <Card>
            <p className="px-[18px] py-4 text-sm text-muted">No tips yet.</p>
          </Card>
        ) : (
          <Card>
            <ul>
              {rows.map((tip) => (
                <li key={tip.id} className="border-b border-line last:border-0">
                  <Link href={`/newsroom/tips/${tip.id}`} className="block px-[18px] py-4 hover:bg-mist">
                    <span className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className={cn("rounded-full px-2.5 py-1", STATUS_STYLE[tip.status])}>{STATUS_LABEL[tip.status]}</span>
                      <span className="text-muted">{tip.anonymous ? "Anonymous" : "Not anonymous"}</span>
                      <time dateTime={tip.createdAt.toISOString()} className="font-semibold text-muted">
                        {formatDateTime(tip.createdAt)}
                      </time>
                    </span>
                    <p className={cn("mt-2 text-sm leading-relaxed", tip.preview === TIP_UNREADABLE ? "font-semibold text-brand-dark" : "text-ink")}>{tip.preview}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
