import Script from "next/script";
import { Suspense } from "react";
import { AdsLoader } from "@/components/AdsLoader";
import { Analytics } from "@/components/Analytics";
import { BreakingBanner } from "@/components/BreakingBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { storyHref } from "@/components/Story";
import { adsenseClient } from "@/lib/ads";
import { breakingStory } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const adClient = adsenseClient();
  // The banner is extra: a database hiccup here shouldn't take the page down with it.
  const breaking = await breakingStory().catch(() => null);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <Header />
      <BreakingBanner
        initial={breaking && { id: breaking.id, title: breaking.title, href: storyHref(breaking), publishedAt: breaking.publishedAt!.toISOString() }}
      />
      <main id="main">{children}</main>
      <Footer />
      {adClient && (
        <>
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          <Suspense>
            <AdsLoader />
          </Suspense>
        </>
      )}
      <Analytics />
    </>
  );
}
