import type { Metadata } from "next";
import Link from "next/link";
import { ElectionResults } from "@/components/ElectionResults";
import { publicElectionResults } from "@/lib/election-results";
import { DEMO_RESULTS, ELECTION_PATH, ELECTION_SOURCE } from "@/lib/elections";
import { pageMeta } from "@/lib/seo";

type Props = { searchParams: Promise<{ demo?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const demo = (await searchParams).demo === "1";
  return pageMeta({ title: demo ? "Demo: South Africa election results" : "South Africa local election results 2026", description: "Explore verified municipal PR results by province and municipality, with vote shares, source links and count status.", path: ELECTION_PATH, noindex: demo });
}
export default async function ElectionsPage({ searchParams }: Props) {
  const demo = (await searchParams).demo === "1";
  const results = demo ? DEMO_RESULTS : await publicElectionResults();
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-8 md:px-6">
      {demo && <div role="note" className="mb-6 border-2 border-amber-500 bg-amber-50 p-4 font-bold text-amber-950">DEMO PREVIEW — all figures and party names below are fictional. These are not election results. <Link href={ELECTION_PATH} className="ml-2 underline">Return to verified results</Link></div>}
      <header className="border-b-[3px] border-ink pb-6">
        <p className="kicker">South Africa · Local elections 2026</p>
        <h1 className="headline mt-3 max-w-4xl text-[36px] leading-tight md:text-[52px]">South Africa election results</h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-2">Explore municipal proportional-representation results as verified figures become available.</p>
        <p className="mt-3 text-sm"><a href={ELECTION_SOURCE} className="font-bold text-teal underline">Election day: 4 November 2026</a> · All update times are South African Standard Time.</p>
      </header>
      <ElectionResults results={results} demo={demo} />
      <section className="mt-10 max-w-3xl border-t border-line pt-5" aria-labelledby="results-method">
        <h2 id="results-method" className="headline text-2xl">How to read these results</h2>
        <p className="mt-3 text-base leading-normal text-ink-2">This page covers municipal PR ballots only. Ward and district ballots are separate contests and are not combined here. Percentages use valid votes counted; spoiled ballots are excluded. Vote shares do not by themselves determine council seats, a mayor or a governing coalition.</p>
        <p className="mt-3 text-base leading-normal text-ink-2">Provisional figures can change. During counting, the ballot-to-registration figure is not final turnout. Each council shows its source and timestamp; editors update the figures after checking them. “Final” means the source has declared that result final. This is not an automatic IEC feed.</p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm font-bold text-teal"><a href="https://www.elections.org.za/pw/" className="underline">Electoral Commission of South Africa</a><Link href="/south-africa" className="underline">South Africa coverage</Link>{!demo && <Link href={`${ELECTION_PATH}?demo=1`} className="underline">Explore the fictional demo</Link>}</div>
      </section>
    </div>
  );
}
