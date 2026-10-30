"use client";

import { useEffect, useState } from "react";

/** Thin red bar showing how far the reader is through the story. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      setPct(Math.round(done * 100));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);
  return (
    <div aria-hidden className="sticky top-0 z-30 h-[3px] bg-line md:h-1">
      <div className="h-full bg-brand transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  );
}
