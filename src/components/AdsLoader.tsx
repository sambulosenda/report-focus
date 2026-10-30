"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Asks AdSense to fill every new ad space on the page, after each page load or navigation. */
export function AdsLoader() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    const w = window as typeof window & { adsbygoogle?: object[] };
    const empty = document.querySelectorAll("ins.adsbygoogle:not([data-adsbygoogle-status])");
    for (let i = 0; i < empty.length; i++) {
      try {
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      } catch {
        // AdSense throws if a space is already filled; the rest still load.
      }
    }
  }, [pathname, search]);
  return null;
}
