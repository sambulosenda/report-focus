import { z } from "zod";

export const ELECTION_PATH = "/elections/south-africa-2026";
export const ELECTION_START = new Date("2026-11-04T00:00:00+02:00");
export const ELECTION_SOURCE = "https://www.sanews.gov.za/south-africa/minister-gazettes-date-local-government-elections";
export const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"] as const;
const count = z.number().int().min(0).max(100_000_000);
export const electionResultInput = z.object({
  municipalityCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,12}$/, "Enter the official municipality code."),
  municipality: z.string().trim().min(2).max(100),
  province: z.enum(PROVINCES),
  status: z.enum(["provisional", "final"]),
  registeredVoters: count.positive().nullable(),
  spoiledVotes: count,
  ballotsCast: count,
  stationsCounted: count.nullable(),
  stationsTotal: count.positive().nullable(),
  parties: z.array(z.object({ name: z.string().trim().min(1).max(100), votes: count })).min(1).max(150),
  sourceName: z.string().trim().min(2).max(150),
  sourceUrl: z.url().max(1000).refine((value) => { try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } }, "Use an HTTPS source URL without credentials."),
  sourceAsOf: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(1500),
}).superRefine((data, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (new Set(data.parties.map((p) => p.name.toLowerCase())).size !== data.parties.length) issue("Each party must appear only once.");
  if (data.parties.reduce((n, p) => n + p.votes, 0) + data.spoiledVotes !== data.ballotsCast) issue("Party votes plus spoiled ballots must equal total ballots counted. Include every party, even those with zero votes.");
  if (data.registeredVoters !== null && data.ballotsCast > data.registeredVoters) issue("Ballots counted cannot exceed registered voters.");
  if ((data.stationsCounted === null) !== (data.stationsTotal === null)) issue("Enter both station counts or leave both blank.");
  if (data.stationsCounted !== null && data.stationsTotal !== null && data.stationsCounted > data.stationsTotal) issue("Counted stations cannot exceed total stations.");
  if (data.status === "final" && data.stationsTotal !== null && data.stationsCounted !== data.stationsTotal) issue("Final results must include all stations.");
});
export type ElectionResultData = z.infer<typeof electionResultInput>;
export type PublicElectionResult = { id: number; data: ElectionResultData; updatedAt: string };
export const validVotes = (data: ElectionResultData) => data.parties.reduce((n, p) => n + p.votes, 0);
export const voteShare = (votes: number, total: number) => total > 0 ? votes / total * 100 : 0;
export const electionTime = (value: string) => new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" });

/** Synthetic parties and numbers for the explicitly labelled preview; never inserted into the database. */
export const DEMO_RESULTS: PublicElectionResult[] = [
  ["DEMO-JHB", "Johannesburg", "Gauteng"], ["DEMO-CPT", "Cape Town", "Western Cape"],
  ["DEMO-ETH", "eThekwini", "KwaZulu-Natal"], ["DEMO-TSH", "Tshwane", "Gauteng"],
].map(([municipalityCode, municipality, province], i) => ({
  id: -(i + 1), updatedAt: "2026-11-05T10:00:00+02:00",
  data: { municipalityCode, municipality, province: province as ElectionResultData["province"], status: i === 1 ? "final" : "provisional",
    registeredVoters: 100000, ballotsCast: 50000, spoiledVotes: 1000, stationsCounted: i === 1 ? 100 : 62, stationsTotal: 100,
    parties: [{ name: "Example Party A", votes: 24000 - i * 1000 }, { name: "Example Party B", votes: 17000 + i * 1000 }, { name: "Example Party C", votes: 8000 }],
    sourceName: "Illustrative data — not IEC results", sourceUrl: "", sourceAsOf: "2026-11-05T09:45:00+02:00", note: "Fictional figures used to demonstrate the results page." },
}));
