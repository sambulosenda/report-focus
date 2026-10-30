import Script from "next/script";
import { Suspense } from "react";
import { AdsLoader } from "@/components/AdsLoader";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { adsenseClient } from "@/lib/ads";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const adClient = adsenseClient();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <Header />
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
