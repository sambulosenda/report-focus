import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { closeTipAction, deleteTipAction } from "@/actions/tips";
import { ActionForm } from "@/components/newsroom/ActionForm";
import { ConfirmButton } from "@/components/newsroom/ConfirmButton";
import { Card, PageHeader, btnBrand, btnGhost } from "@/components/newsroom/ui";
import type { TipStatus } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { TIP_UNREADABLE, tipForEditor } from "@/lib/tips";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Tip" };

const STATUS_LABEL: Record<TipStatus, string> = { new: "New", read: "Read", closed: "Closed" };

export default async function TipPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("editor");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const opened = await tipForEditor(user, id);
  if ("error" in opened) notFound();
  const { tip, contents } = opened;

  return (
    <>
      <PageHeader title="Tip" description={formatDateTime(tip.createdAt)}>
        <Link href="/newsroom/tips" className={btnGhost}>
          All tips
        </Link>
      </PageHeader>
      <div className="space-y-4 p-4 md:p-6 md:px-8">
        <Card className="px-[18px] py-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
            {STATUS_LABEL[tip.status]}
            {tip.anonymous ? " · Asked to stay anonymous" : ""}
          </p>
          {contents ? (
            <>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{contents.body}</p>
              {!tip.anonymous && (
                <dl className="mt-6 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">Name</dt>
                    <dd className="mt-1 text-ink">{contents.name || "Not given"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">How to reach them</dt>
                    <dd className="mt-1 break-words text-ink">{contents.contact || "Not given"}</dd>
                  </div>
                </dl>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm font-semibold text-brand-dark">{TIP_UNREADABLE}</p>
          )}
        </Card>
        <div className="flex flex-wrap gap-2">
          {tip.status !== "closed" && (
            <ActionForm action={closeTipAction}>
              <input type="hidden" name="id" value={tip.id} />
              <button className={btnGhost}>Close tip</button>
            </ActionForm>
          )}
          <ActionForm action={deleteTipAction}>
            <input type="hidden" name="id" value={tip.id} />
            <ConfirmButton className={btnBrand} message="Delete this tip? It cannot be recovered.">
              Delete tip
            </ConfirmButton>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
