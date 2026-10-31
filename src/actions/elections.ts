"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { storeElectionResult } from "@/lib/election-results";
import { ELECTION_PATH } from "@/lib/elections";
import type { FormState } from "./auth";
export async function saveElectionResult(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("editor");
  const number = (key: string) => form.get(key) === "" || form.get(key) === null ? null : Number(form.get(key));
  const names = form.getAll("partyName"); const votes = form.getAll("partyVotes");
  const localTime = String(form.get("sourceAsOf") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localTime)) return { error: "Enter the source date and time in South African Standard Time." };
  const result = await storeElectionResult(user, {
    id: number("id") ?? undefined, revision: number("revision") ?? 0,
    published: form.get("published") === "on", verified: form.get("verified") === "on",
    data: { municipalityCode: form.get("municipalityCode"), municipality: form.get("municipality"), province: form.get("province"), status: form.get("status"),
      registeredVoters: number("registeredVoters"), spoiledVotes: number("spoiledVotes"), ballotsCast: number("ballotsCast"), stationsCounted: number("stationsCounted"), stationsTotal: number("stationsTotal"),
      parties: names.map((name, i) => ({ name, votes: votes[i] === "" ? NaN : Number(votes[i]) })), sourceName: form.get("sourceName"), sourceUrl: form.get("sourceUrl"), sourceAsOf: `${localTime}:00+02:00`, note: form.get("note") ?? "" },
  });
  if (result.ok) { revalidatePath(ELECTION_PATH); revalidatePath("/newsroom/elections"); }
  return result;
}
