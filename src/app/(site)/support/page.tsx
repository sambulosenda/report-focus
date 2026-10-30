import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { donateProvider, donateUrl } from "@/lib/ads";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support our journalism",
  description: `Help keep ${SITE_NAME} independent and free to read.`,
};

/** Reader donations. The payment itself happens on the provider's page set in DONATE_URL. */
export default function SupportPage() {
  const url = donateUrl();
  if (!url) notFound();
  const provider = donateProvider(url);

  return (
    <div className="mx-auto max-w-[780px] px-4 pb-16 pt-8 md:px-6 md:pt-12">
      <h1 className="headline border-b-[3px] border-ink pb-[18px] text-[32px] leading-[1.1] md:text-[44px]">Support our journalism</h1>
      <div className="article-body mt-8">
        <p>
          {SITE_NAME} is free for everyone to read. We want to keep it that way, so that good information reaches people whether or not they can pay for it.
        </p>
        <p>
          Reporting costs money. Reader contributions pay for reporters in the field, for the time it takes to check a story properly, and for the coverage that advertising alone does not fund.
        </p>
        <p>Every contribution helps, whatever the size.</p>
      </div>
      <div className="mt-8 border-t border-line pt-6">
        <a href={url} rel="noopener" className="inline-flex h-[50px] items-center bg-teal px-7 text-base font-bold text-white hover:bg-teal-hover hover:no-underline">
          Make a contribution
        </a>
        <p className="mt-3 text-sm text-muted">
          {provider ? `Payments are handled securely by ${provider}.` : "You will be taken to our secure payment page."} {SITE_NAME} never sees your card details.
        </p>
      </div>
    </div>
  );
}
