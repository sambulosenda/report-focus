import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { electionResults, electionResultHistory, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ELECTION_PATH, electionTime } from "@/lib/elections";
import { ElectionResultEditor } from "@/components/newsroom/ElectionResultEditor";
import { PageHeader, btnGhost } from "@/components/newsroom/ui";
export const metadata: Metadata = { title: "Election results" };
export default async function ElectionsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireUser("editor");
  const rows = await db.select().from(electionResults).orderBy(electionResults.municipalityCode);
  const { edit } = await searchParams;
  const selected = edit ? rows.find((r) => r.id === Number(edit)) : undefined;
  if (edit && !selected) notFound();
  const history = selected ? await db.select({ entry: electionResultHistory, editor: users.name }).from(electionResultHistory).leftJoin(users, eq(users.id, electionResultHistory.editorId)).where(eq(electionResultHistory.resultId, selected.id)).orderBy(desc(electionResultHistory.revision)).limit(20) : [];
  return <>
    <PageHeader title="South Africa election results" description="2026 local elections · Municipal PR ballots only"><Link href={ELECTION_PATH} className={btnGhost}>View results page</Link><Link href={`${ELECTION_PATH}?demo=1`} className={btnGhost}>Fictional demo</Link></PageHeader>
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-xl border border-line bg-white p-5"><h2 className="text-lg font-bold">Municipalities</h2><Link href="/newsroom/elections" className="my-3 inline-flex min-h-11 items-center font-bold text-teal underline">Add a municipality</Link>{rows.length ? <ul className="divide-y divide-line">{rows.map((r) => <li key={r.id} className="flex flex-wrap justify-between gap-2 py-3"><Link href={`/newsroom/elections?edit=${r.id}`} className="font-bold text-teal underline">{r.data.municipality} ({r.municipalityCode})</Link><span className="text-sm">{r.published ? "Published" : "Draft"} · {r.data.status} · revision {r.revision}</span></li>)}</ul> : <p className="text-sm text-muted">No results entered. Demo figures are separate and never become published results.</p>}</section>
      <ElectionResultEditor key={selected ? `${selected.id}-${selected.revision}` : `new-${rows.length}`} record={selected ? { id: selected.id, revision: selected.revision, published: selected.published, data: selected.data } : undefined} />
      {history.length > 0 && <section className="rounded-xl border border-line bg-white p-5"><h2 className="text-lg font-bold">Revision history</h2><p className="mt-2 text-sm text-muted">The latest 20 saved versions, including drafts and withdrawals.</p><ol className="mt-4 space-y-3">{history.map(({ entry: h, editor }) => <li key={h.id}><details className="border-t border-line pt-3"><summary className="cursor-pointer text-sm font-bold">Revision {h.revision} · {h.published ? "Published" : "Draft"} · {editor ?? "Former staff"} · {electionTime(h.createdAt.toISOString())} SAST</summary><div className="mt-3 space-y-2 text-sm"><p>{h.data.status} · {h.data.ballotsCast.toLocaleString()} ballots counted · {h.data.spoiledVotes.toLocaleString()} spoiled</p><p>Registered voters: {h.data.registeredVoters ?? "Not reported"}. Stations: {h.data.stationsCounted ?? "Not reported"} / {h.data.stationsTotal ?? "Not reported"}.</p><ul>{h.data.parties.map((p) => <li key={p.name}>{p.name}: {p.votes.toLocaleString()}</li>)}</ul><p>Source: <a className="text-teal underline" href={h.data.sourceUrl} rel="noopener noreferrer" target="_blank">{h.data.sourceName}</a> · {electionTime(h.data.sourceAsOf)} SAST</p><p className="whitespace-pre-line">{h.data.note}</p></div></details></li>)}</ol></section>}
    </div>
  </>;
}
