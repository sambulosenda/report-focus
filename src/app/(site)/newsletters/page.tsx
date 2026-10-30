import type { Metadata } from "next";
import { NewsletterCard } from "@/components/NewsletterForm";
import { STANDING_LISTS, sectionDescription } from "@/lib/newsletters";
import { navCategories } from "@/lib/queries";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Newsletters",
  description: `Sign up for The Morning Focus, breaking-news alerts and section newsletters from ${SITE_NAME}.`,
  alternates: { canonical: "/newsletters" },
};

export default async function NewslettersPage() {
  const cats = await navCategories();
  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-8 md:px-6 md:pt-12">
      <h1 className="headline border-b-[3px] border-ink pb-[18px] text-[32px] leading-[1.1] md:text-[44px]">Newsletters</h1>
      <p className="mt-4 max-w-[640px] text-[17px] leading-normal text-ink-2">
        Our journalism in your inbox. You can unsubscribe from any email with one tap.
      </p>
      <div className="mt-8 grid gap-x-10 gap-y-9 md:grid-cols-2">
        {STANDING_LISTS.map((l) => (
          <NewsletterCard key={l.list} id={l.list} label={l.name} text={l.description} list={l.list} />
        ))}
      </div>
      {cats.length > 0 && (
        <>
          <h2 className="headline mt-14 text-[26px]">From our sections</h2>
          <div className="mt-5 grid gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => (
              <NewsletterCard
                key={c.id}
                id={`section-${c.slug}`}
                label={`${c.name} Focus`}
                text={sectionDescription(c.name)}
                list={`section-${c.slug}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
