"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Last resort when the page frame itself fails. It can't rely on the site's styles, so it carries its own. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Georgia, serif", background: "#fff", color: "#111" }}>
        <main style={{ maxWidth: 560, margin: "15vh auto", padding: "0 16px", textAlign: "center" }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 800, letterSpacing: "0.12em", fontSize: 13, color: "#004666" }}>
            REPORT FOCUS NEWS
          </p>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "12px 0" }}>We’re having trouble loading the site</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5 }}>We’ve been told about the problem. Please try again in a minute.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, height: 48, padding: "0 22px", border: 0, background: "#004666", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
