import React from "react";
import { correctionsFor } from "@/lib/corrections";
import { formatDateTime } from "@/lib/utils";
export async function CorrectionHistory({ articleId }: { articleId: number }) {
  const notes = await correctionsFor(articleId);
  if (!notes.length) return null;
  return (
    <section aria-label="Corrections and clarifications" className="my-6 border-l-4 border-teal bg-slate-50 p-5">
      <h2 className="headline text-2xl">Corrections and clarifications</h2>
      <ol className="mt-3 space-y-4">{notes.map((note) => (
        <li key={note.id}>
          <time dateTime={note.createdAt.toISOString()} className="text-sm font-bold text-muted">{formatDateTime(note.createdAt)}</time>
          <p className="mt-1 whitespace-pre-line break-words text-base leading-normal text-ink-2">{note.body}</p>
        </li>
      ))}</ol>
    </section>
  );
}
