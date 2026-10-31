"use client";
import { useActionState, useRef, useState } from "react";
import { saveElectionResult } from "@/actions/elections";
import { PROVINCES, type ElectionResultData } from "@/lib/elections";
import { inputClass, btnBrand, btnGhost } from "./ui";

type Record = { id: number; revision: number; published: boolean; data: ElectionResultData };
export function ElectionResultEditor({ record }: { record?: Record }) {
  const d = record?.data;
  const [state, action, pending] = useActionState(saveElectionResult, undefined);
  const [parties, setParties] = useState((d?.parties ?? [{ name: "", votes: 0 }]).map((p, key) => ({ ...p, key })));
  const nextKey = useRef(parties.length);
  const time = d ? new Date(new Date(d.sourceAsOf).getTime() + 2 * 3600000).toISOString().slice(0, 16) : "";
  const field = "flex flex-col gap-2 text-sm font-bold";
  return (
    <form action={action} className="rounded-xl border border-line bg-white p-5 md:p-7">
      <h2 className="text-xl font-bold">{record ? `Edit ${d!.municipality}` : "Add municipality results"}</h2>
      <p className="mt-2 text-sm text-muted">Enter municipal PR ballots only, with every party included. Use official municipality codes. Publication requires a checked source; final status must match an official declaration.</p>
      <fieldset disabled={pending} className="mt-5 space-y-5 disabled:opacity-60">
        <legend className="sr-only">Municipal PR result</legend>
        <input type="hidden" name="id" value={record?.id ?? ""} /><input type="hidden" name="revision" value={record?.revision ?? 0} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={field}>Municipality code<input name="municipalityCode" required readOnly={!!record} maxLength={12} defaultValue={d?.municipalityCode} className={inputClass} placeholder="e.g. JHB" /></label>
          <label className={field}>Municipality name<input name="municipality" required maxLength={100} defaultValue={d?.municipality} className={inputClass} /></label>
          <label className={field}>Province<select name="province" required defaultValue={d?.province ?? ""} className={inputClass}><option value="" disabled>Select a province</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className={field}>Count status<select name="status" defaultValue={d?.status ?? "provisional"} className={inputClass}><option value="provisional">Provisional</option><option value="final">Final — declared by source</option></select></label>
          <label className={field}>Total PR ballots counted (including spoiled)<input name="ballotsCast" type="number" min={0} step={1} required defaultValue={d?.ballotsCast} className={inputClass} /></label>
          <label className={field}>Spoiled PR ballots<input name="spoiledVotes" type="number" min={0} step={1} required defaultValue={d?.spoiledVotes ?? 0} className={inputClass} /></label>
          <label className={field}>Registered voters (optional)<input name="registeredVoters" type="number" min={1} step={1} defaultValue={d?.registeredVoters ?? ""} className={inputClass} /></label>
          <div className="grid grid-cols-2 gap-3"><label className={field}>Stations counted<input name="stationsCounted" type="number" min={0} step={1} defaultValue={d?.stationsCounted ?? ""} className={inputClass} /></label><label className={field}>Total stations<input name="stationsTotal" type="number" min={1} step={1} defaultValue={d?.stationsTotal ?? ""} className={inputClass} /></label></div>
        </div>
        <fieldset className="space-y-3"><legend className="mb-3 text-sm font-bold">Party votes</legend>{parties.map((p, i) => <div key={p.key} className="grid grid-cols-[minmax(0,1fr)_100px_auto] items-end gap-2"><label className={field}>Party {i+1}<input name="partyName" required maxLength={100} defaultValue={p.name} className={inputClass} /></label><label className={field}>Votes<input name="partyVotes" type="number" min={0} step={1} required defaultValue={p.votes} className={inputClass} /></label><button type="button" disabled={parties.length === 1} aria-label={`Remove party row ${i+1}`} onClick={() => setParties(parties.filter((item) => item.key !== p.key))} className="min-h-11 px-2 text-sm font-bold text-brand disabled:opacity-40">Remove</button></div>)}<button type="button" disabled={parties.length >= 150} onClick={() => setParties([...parties, { name: "", votes: 0, key: nextKey.current++ }])} className={btnGhost}>Add party</button></fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={field}>Source name<input name="sourceName" required maxLength={150} defaultValue={d?.sourceName} className={inputClass} placeholder="IEC results portal" /></label>
          <label className={field}>Source URL<input name="sourceUrl" type="url" required maxLength={1000} defaultValue={d?.sourceUrl} className={inputClass} placeholder="https://…" /></label>
          <label className={field}>Source date and time (SAST, UTC+2)<input name="sourceAsOf" type="datetime-local" step={60} required defaultValue={time} className={inputClass} /></label>
        </div>
        <label className={field}>Public note (optional)<textarea name="note" rows={3} maxLength={1500} defaultValue={d?.note} className={inputClass} placeholder="Explain any revision or qualification to these figures." /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="verified" className="mt-0.5 h-4 w-4" />I checked the municipality, ballot type, figures, timestamp and status against the source.</label>
        <label className="flex items-start gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={record?.published ?? false} className="mt-0.5 h-4 w-4" />Publish on the results page (available from election day). Uncheck to keep or withdraw as a draft.</label>
        <button className={btnBrand}>{pending ? "Saving…" : "Save result"}</button>
      </fieldset>
      {state?.error && <p role="alert" className="mt-4 font-bold text-brand">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-4 font-bold text-teal">{state.ok}</p>}
    </form>
  );
}
