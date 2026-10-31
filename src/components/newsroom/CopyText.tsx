"use client";

import { useState } from "react";
import { btnGhost } from "./ui";

/** Copies a prepared WhatsApp post. The button does not submit the form around it. */
export function CopyText({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btnGhost}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this post", text);
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
