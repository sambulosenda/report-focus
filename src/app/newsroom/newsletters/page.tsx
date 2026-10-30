import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { emailEditionNow } from "@/actions/newsletter";
import { db } from "@/db";
import { emailSends, newsletterSignups, users } from "@/db/schema";
import { ActionForm } from "@/components/newsroom/ActionForm";
import { ConfirmButton } from "@/components/newsroom/ConfirmButton";
import { Card, PageHeader, btnGhost } from "@/components/newsroom/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { emailProvider } from "@/lib/email";
import { BREAKING, STANDING_LISTS, editionDate, listInfo } from "@/lib/newsletters";
import { navCategories } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Newsletters" };

export default async function NewslettersAdminPage() {
  const user = await requireUser("editor");
  const [counts, sends, cats] = await Promise.all([
    db
      .select({
        list: newsletterSignups.list,
        readers: sql<number>`sum(case when ${newsletterSignups.confirmedAt} is not null and ${newsletterSignups.unsubscribedAt} is null then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${newsletterSignups.confirmedAt} is null and ${newsletterSignups.unsubscribedAt} is null then 1 else 0 end)`,
        left: sql<number>`sum(case when ${newsletterSignups.unsubscribedAt} is not null then 1 else 0 end)`,
      })
      .from(newsletterSignups)
      .groupBy(newsletterSignups.list),
    db
      .select({ send: emailSends, by: users.name })
      .from(emailSends)
      .leftJoin(users, eq(users.id, emailSends.sentBy))
      .orderBy(desc(emailSends.createdAt), desc(emailSends.id))
      .limit(20),
    navCategories(),
  ]);

  // Every newsletter readers can pick, plus any older list that still has sign-ups.
  const listIds = [...STANDING_LISTS.map((l) => l.list), ...cats.map((c) => `section-${c.slug}`)];
  for (const c of counts) if (!listIds.includes(c.list)) listIds.push(c.list);
  const lists = await Promise.all(listIds.map(async (id) => ({ id, name: (await listInfo(id))?.name ?? id, count: counts.find((c) => c.list === id) })));
  const nameOf = (id: string) => lists.find((l) => l.id === id)?.name ?? id;
  const today = editionDate();
  const sentToday = new Set(sends.filter((s) => s.send.edition === today).map((s) => s.send.list));
  const provider = emailProvider();
  const n = (v: number | null | undefined) => Number(v ?? 0);

  return (
    <>
      <PageHeader title="Newsletters" description="Who has signed up, and what has been sent.">
        {hasRole(user, "admin") && (
          <form action="/api/newsletter/export">
            <button className={btnGhost}>Download readers (CSV)</button>
          </form>
        )}
      </PageHeader>
      <div className="space-y-6 p-4 md:p-6 md:px-8">
        {provider === "console" ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Email isn’t connected yet, so nothing reaches readers: messages are written to the server log instead. Set <code>EMAIL_PROVIDER=resend</code>,{" "}
            <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> to start sending.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Sending through <b className="capitalize text-ink">{provider}</b>. Readers must confirm their email before they get anything.
          </p>
        )}

        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
              <tr>
                <th className="px-[18px] py-3">Newsletter</th>
                <th className="px-3 py-3 text-right">Readers</th>
                <th className="px-3 py-3 text-right">Not confirmed</th>
                <th className="px-3 py-3 text-right">Unsubscribed</th>
                <th className="px-[18px] py-3 text-right">Send</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((l) => {
                const readers = n(l.count?.readers);
                return (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="px-[18px] py-3 font-bold">{l.name}</td>
                    <td className="px-3 py-3 text-right tabular">{readers.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular text-muted">{n(l.count?.pending).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular text-muted">{n(l.count?.left).toLocaleString()}</td>
                    <td className="px-[18px] py-3 text-right">
                      {l.id === BREAKING ? (
                        <span className="text-muted">From the dashboard banner</span>
                      ) : sentToday.has(l.id) ? (
                        <span className="text-muted">Sent today</span>
                      ) : readers > 0 ? (
                        <ActionForm action={emailEditionNow} className="flex flex-col items-end">
                          <input type="hidden" name="list" value={l.id} />
                          <ConfirmButton className="font-bold text-teal hover:underline" message={`Send today’s edition of ${l.name} to ${readers.toLocaleString()} reader${readers === 1 ? "" : "s"} now?`}>
                            Send today’s edition
                          </ConfirmButton>
                        </ActionForm>
                      ) : (
                        <span className="text-muted">No readers yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <p className="text-sm text-muted">
          Each edition carries the five top stories of the past 24 hours. To send them automatically every weekday morning, have a scheduler call{" "}
          <code>POST /api/newsletter/send</code> with the <code>CRON_SECRET</code>. An edition never goes out twice on the same day.
        </p>

        <Card>
          <h2 className="border-b border-line px-[18px] py-3.5 font-bold">Recent sends</h2>
          {sends.length === 0 ? (
            <p className="px-[18px] py-4 text-sm text-muted">Nothing has been sent yet.</p>
          ) : (
            <ul>
              {sends.map(({ send: s, by }) => (
                <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-[18px] py-3 text-sm last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="font-bold">{s.subject}</span>
                    <span className="block text-muted">
                      {nameOf(s.list)} · {s.recipients.toLocaleString()} reader{s.recipients === 1 ? "" : "s"} · {by ?? "Scheduled"}
                    </span>
                  </span>
                  <span className="text-muted tabular">
                    {formatDate(s.createdAt)}, {formatTime(s.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
