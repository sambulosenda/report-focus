import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { storyHref } from "@/components/Story";
import { latestStories } from "@/lib/queries";

export default async function NotFound() {
  const top = await latestStories(4).catch(() => []);
  return (
    <>
      <Header />
      <main id="main" className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 px-4 py-14 text-center md:px-6 md:py-[72px]">
        <p className="text-[13px] font-extrabold tracking-[0.12em] text-brand">ERROR 404</p>
        <h1 className="headline text-[32px] leading-[1.1] tracking-[-0.015em] md:text-[44px]">We can’t find that page</h1>
        <p className="max-w-[520px] text-lg leading-[1.55] text-ink-2">The link may be broken, or the story may have moved. Try searching, or start from the homepage.</p>
        <form role="search" action="/search" className="mt-2 flex w-full max-w-[520px] gap-2.5">
          <label htmlFor="nf-q" className="sr-only">Search Report Focus News</label>
          <input id="nf-q" name="q" type="search" placeholder="Search stories" className="h-[50px] min-w-0 flex-1 rounded-full border border-[#9ca3af] px-[18px] text-base outline-none focus:border-ink" />
          <button className="h-[50px] rounded-full bg-teal px-[22px] text-[15px] font-bold text-white hover:bg-teal-hover">Search</button>
        </form>
        <Link href="/" className="mt-1 inline-flex min-h-11 items-center text-[15px] font-bold text-teal hover:underline">
          Go to the homepage →
        </Link>
        {top.length > 0 && (
          <section className="mt-8 w-full text-left" aria-labelledby="top-now">
            <h2 id="top-now" className="inline-block border-b-[3px] border-brand pb-2 text-xl font-extrabold">Top stories right now</h2>
            {top.map((s) => (
              <Link key={s.id} href={storyHref(s)} className="story-title headline block border-b border-line py-[13px] text-lg leading-[1.28]">
                {s.title}
              </Link>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
