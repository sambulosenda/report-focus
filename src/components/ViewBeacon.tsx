"use client";

import { useEffect } from "react";

/**
 * Counts a story view from the reader's browser, so the page itself can be cached.
 * A reader is counted once per story per browser tab session.
 */
export function ViewBeacon({ articleId }: { articleId: number }) {
  useEffect(() => {
    const key = `rf_viewed_${articleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: count the view anyway */
    }
    const url = `/api/views/${articleId}`;
    if (!navigator.sendBeacon?.(url)) fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  }, [articleId]);
  return null;
}
