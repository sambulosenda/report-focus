"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: "Share on X", short: "X", href: `https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}` },
    { label: "Share on Facebook", short: "f", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "Share on WhatsApp", short: "WA", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { label: "Share by email", short: "@", href: `mailto:?subject=${enc(title)}&body=${enc(url)}` },
  ];

  async function copy() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* fall back to copying */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const btn = "grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-xs font-black hover:border-navy hover:bg-navy hover:text-white";
  return (
    <div className="flex items-center gap-2">
      {links.map((l) => (
        <a key={l.short} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} title={l.label} className={btn}>
          {l.short}
        </a>
      ))}
      <button type="button" onClick={copy} className={btn} aria-label="Copy link">
        {copied ? "Copied" : "Link"}
      </button>
    </div>
  );
}
