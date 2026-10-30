"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, FacebookIcon, LinkIcon, MailIcon, WhatsAppIcon, XIcon } from "./icons";

export function ShareButtons({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: "Share on X", Icon: XIcon, href: `https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}` },
    { label: "Share on Facebook", Icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "Share on WhatsApp", Icon: WhatsAppIcon, href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { label: "Share by email", Icon: MailIcon, href: `mailto:?subject=${enc(title)}&body=${enc(url)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  const btn = "inline-flex h-11 w-11 items-center justify-center text-ink hover:text-teal";
  return (
    <div className={cn("-mx-3 flex", className)}>
      {links.map(({ label, Icon, href }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={btn}>
          <Icon size={16} />
        </a>
      ))}
      <button type="button" onClick={copy} className={btn} aria-label={copied ? "Link copied" : "Copy link"} title="Copy link">
        {copied ? <CheckIcon size={17} /> : <LinkIcon size={17} />}
      </button>
      <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
    </div>
  );
}

/** Small text button that copies a link to one live update. */
export function CopyLinkButton({ url, label = "Share" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link", url);
        }
      }}
      className="font-bold text-teal hover:underline"
    >
      {copied ? "Link copied" : label}
    </button>
  );
}
