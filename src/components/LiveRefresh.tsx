"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Checks for new live updates once a minute and offers a button to show them. */
export function LiveRefresh({ articleId, latestId }: { articleId: number; latestId: number }) {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const check = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/live/${articleId}?since=${latestId}`, { cache: "no-store" });
        if (res.ok) setCount((await res.json()).newCount ?? 0);
      } catch {
        /* offline: try again next time */
      }
    };
    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, [articleId, latestId]);

  return (
    <div aria-live="polite" className="flex min-h-10 justify-center">
      {count > 0 && (
        <button
          type="button"
          onClick={() => {
            router.refresh();
            document.getElementById("updates")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="h-10 bg-teal px-[18px] text-sm font-bold text-white hover:bg-teal-hover"
        >
          ↑ {count} new update{count === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}
