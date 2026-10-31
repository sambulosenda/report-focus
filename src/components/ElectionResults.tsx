"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PROVINCES, electionTime, validVotes, voteShare, type PublicElectionResult } from "@/lib/elections";
const number = (n: number) => n.toLocaleString("en-ZA");
export function ElectionResults({ results, demo = false }: { results: PublicElectionResult[]; demo?: boolean }) {
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const inProvince = results.filter((r) => !province || r.data.province === province);
  const shown = inProvince.filter((r) => !municipality || r.data.municipalityCode === municipality);
  const select = "min-h-11 w-full border border-line-2 bg-white px-3 text-base";
  return (
    <section aria-label="Explore municipal results" className="mt-8">
      <div className="grid gap-4 border-y border-line bg-slate-50 px-4 py-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm font-bold">Province<select value={province} onChange={(e) => { setProvince(e.target.value); setMunicipality(""); }} className={`${select} mt-2`}><option value="">All provinces</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="text-sm font-bold">Municipality<select value={municipality} onChange={(e) => setMunicipality(e.target.value)} className={`${select} mt-2`}><option value="">All municipalities with results</option>{[...inProvince].sort((a,b) => a.data.municipality.localeCompare(b.data.municipality)).map((r) => <option key={r.id} value={r.data.municipalityCode}>{r.data.municipality}</option>)}</select></label>
        <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="min-h-11 bg-teal px-5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Refreshing…" : "Refresh results"}</button>
      </div>
      <p role="status" className="my-4 text-sm text-muted">{demo ? "Demo: " : ""}{shown.length} {shown.length === 1 ? "municipality" : "municipalities"} in this view. {pending ? "Checking for updates…" : "Use Refresh results to check for new figures."}</p>
      {shown.length === 0 ? (
        <div className="border-t-2 border-teal py-8"><h2 className="headline text-3xl">Awaiting verified results</h2><p className="mt-3 max-w-2xl text-ink-2">No verified results have been published for this selection. Figures will appear after editors check the source. Missing results do not mean zero votes.</p></div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">{shown.map((row) => {
          const d = row.data; const total = validVotes(d);
          const parties = [...d.parties].sort((a,b) => b.votes-a.votes || a.name.localeCompare(b.name));
          return (
            <article key={row.id} className="min-w-0 border border-line p-5 md:p-6">
              {demo && <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-brand">Demo — fictional results</p>}
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="kicker">{d.province}</p><span className={`px-2.5 py-1 text-xs font-bold ${d.status === "final" ? "bg-teal text-white" : "bg-amber-100 text-amber-900"}`}>{d.status === "final" ? "Final" : "Provisional"}</span></div>
              <h2 className="headline mt-3 text-[28px] leading-tight">{d.municipality}</h2>
              <p className="mt-1 text-sm text-muted">Municipal PR ballot · {d.municipalityCode}</p>
              <dl className="my-5 grid grid-cols-2 gap-4 border-y border-line py-4 text-sm">
                <div><dt className="text-muted">Valid votes counted</dt><dd className="mt-1 text-xl font-bold tabular">{number(total)}</dd></div>
                <div><dt className="text-muted">Stations counted</dt><dd className="mt-1 text-xl font-bold tabular">{d.stationsCounted === null ? "Not reported" : `${number(d.stationsCounted)} / ${number(d.stationsTotal!)}`}</dd></div>
                <div><dt className="text-muted">{d.status === "final" ? "Ballot turnout" : "Counted ballots / registered voters"}</dt><dd className="mt-1 font-bold tabular">{d.registeredVoters === null ? "Not reported" : `${voteShare(d.ballotsCast, d.registeredVoters).toFixed(1)}%`}</dd></div>
                <div><dt className="text-muted">Spoiled ballots</dt><dd className="mt-1 font-bold tabular">{number(d.spoiledVotes)}</dd></div>
              </dl>
              <table className="w-full table-fixed text-left text-sm"><caption className="mb-3 text-left text-sm text-muted">Vote share of valid municipal PR ballots counted</caption><thead><tr className="border-b border-line"><th scope="col" className="w-[50%] pb-2">Party</th><th scope="col" className="pb-2 text-right">Votes</th><th scope="col" className="pb-2 text-right">Share</th></tr></thead><tbody>{parties.map((p) => <tr key={p.name} className="border-b border-line"><th scope="row" className="break-words py-3 pr-3 font-semibold">{p.name}<span aria-hidden="true" className="mt-2 block h-1.5 bg-slate-100"><span className="block h-full bg-teal" style={{width: `${voteShare(p.votes,total)}%`}} /></span></th><td className="text-right tabular">{number(p.votes)}</td><td className="text-right tabular">{total ? `${voteShare(p.votes,total).toFixed(1)}%` : "—"}</td></tr>)}</tbody></table>
              {d.status === "provisional" && <p className="mt-4 text-sm text-muted">These results have not been declared final. Current vote shares do not establish a winner or council control.</p>}
              {d.note && <p className="mt-4 whitespace-pre-line break-words text-sm text-ink-2">{d.note}</p>}
              <p className="mt-4 text-sm font-bold">Source: {demo ? d.sourceName : <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal underline">{d.sourceName}</a>}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Source as of <time dateTime={d.sourceAsOf}>{electionTime(d.sourceAsOf)}</time> SAST<br/>Updated here <time dateTime={row.updatedAt}>{electionTime(row.updatedAt)}</time> SAST</p>
            </article>
          );
        })}</div>
      )}
    </section>
  );
}
