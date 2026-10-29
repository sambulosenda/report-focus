import { BreakingBanner } from "@/components/BreakingBanner";
import { CardStory, LeadStory, RowStory, SectionHeading, TextStory } from "@/components/Story";
import { breakingStory, featuredStories, latestStories, mostRead, navCategories, sectionRails } from "@/lib/queries";

export default async function HomePage() {
  const [breaking, featured, latest, popular, cats] = await Promise.all([
    breakingStory(),
    featuredStories(5),
    latestStories(30),
    mostRead(6),
    navCategories(),
  ]);

  if (latest.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="headline text-3xl">No stories published yet</h1>
        <p className="mt-3 text-muted">Sign in to the newsroom to write and publish the first story.</p>
      </div>
    );
  }

  // Lead is the newest featured story; fall back to the newest story overall.
  const lead = featured[0] ?? latest[0];
  const used = new Set([lead.id]);
  const top: typeof latest = [];
  for (const s of [...featured.slice(1), ...latest]) {
    if (top.length === 4) break;
    if (used.has(s.id)) continue;
    used.add(s.id);
    top.push(s);
  }
  const latestList = latest.filter((s) => !used.has(s.id)).slice(0, 8);
  const rails = await sectionRails(cats);

  return (
    <>
      {breaking && <BreakingBanner story={breaking} />}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <h1 className="sr-only">Report Focus: top stories</h1>
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <LeadStory story={lead} />
            <div className="flex flex-col gap-6 md:border-l md:border-line md:pl-6">
              {top.map((s) => (
                <CardStory key={s.id} story={s} size="sm" />
              ))}
            </div>
          </div>
          <aside className="lg:border-l lg:border-line lg:pl-6" aria-labelledby="latest-h">
            <h2 id="latest-h" className="flex items-center gap-2 border-b-2 border-ink pb-2 text-lg font-black uppercase">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-brand" /> Latest headlines
            </h2>
            <div className="divide-y divide-line">
              {latestList.map((s) => (
                <TextStory key={s.id} story={s} />
              ))}
            </div>
          </aside>
        </section>

        {popular.length > 0 && (
          <section className="mt-12 rounded-lg bg-mist p-6">
            <SectionHeading title="Most read" />
            <ol className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((s, i) => (
                <li key={s.id}>
                  <TextStory story={s} index={i} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {cats.map((c) => {
          const stories = rails.get(c.id) ?? [];
          if (stories.length === 0) return null;
          const [first, ...rest] = stories;
          return (
            <section key={c.id} className="mt-12">
              <SectionHeading title={c.name} href={`/${c.slug}`} color={c.color} />
              <div className="grid gap-6 md:grid-cols-2">
                <CardStory story={first} />
                <div className="flex flex-col gap-5">
                  {rest.map((s) => (
                    <RowStory key={s.id} story={s} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
