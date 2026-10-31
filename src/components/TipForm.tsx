"use client";

import { useActionState, useId, useState } from "react";
import { submitTip } from "@/actions/tips";

const field = "w-full border border-[#9ca3af] bg-white px-3.5 text-base text-ink outline-none focus:border-ink";

export function TipForm() {
  const [state, action, pending] = useActionState(submitTip, undefined);
  const [anonymous, setAnonymous] = useState(false);
  const bodyId = useId();
  const nameId = useId();
  const contactId = useId();
  const anonId = useId();

  if (state?.ok) {
    return (
      <p role="status" className="mt-8 border border-teal bg-slate-50 px-4 py-4 text-[15px] font-semibold text-ink">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4 border-t-2 border-ink pt-6">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label htmlFor={bodyId} className="flex flex-col gap-1.5 text-sm font-bold">
        What happened, when and where
        <textarea
          id={bodyId}
          name="body"
          required
          minLength={20}
          maxLength={8000}
          rows={8}
          placeholder="What you know, and where and when it happened"
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? `${bodyId}-error` : undefined}
          className={`${field} py-3`}
        />
      </label>
      <label htmlFor={nameId} className="flex flex-col gap-1.5 text-sm font-bold">
        Your name <span className="font-semibold text-muted">optional</span>
        <input id={nameId} name="name" type="text" maxLength={120} autoComplete="name" disabled={anonymous} className={`${field} h-[46px] disabled:bg-slate-50 disabled:text-muted`} />
      </label>
      <label htmlFor={contactId} className="flex flex-col gap-1.5 text-sm font-bold">
        How we can reach you <span className="font-semibold text-muted">optional</span>
        <input
          id={contactId}
          name="contact"
          type="text"
          maxLength={200}
          autoComplete="email"
          placeholder="Email, phone or Signal"
          disabled={anonymous}
          className={`${field} h-[46px] disabled:bg-slate-50 disabled:text-muted`}
        />
      </label>
      <label htmlFor={anonId} className="flex items-start gap-2.5 text-sm">
        <input
          id={anonId}
          name="anonymous"
          type="checkbox"
          value="1"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-teal"
        />
        <span>
          <span className="font-bold">Keep me anonymous</span>
          <span className="mt-0.5 block text-ink-2">We will not keep your name or a way to reach you, and we will not be able to reply.</span>
        </span>
      </label>
      {state?.error && (
        <p id={`${bodyId}-error`} role="alert" className="text-sm font-semibold text-brand">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="h-12 bg-teal text-base font-extrabold text-white hover:bg-teal-hover disabled:opacity-60">
        {pending ? "Sending…" : "Send tip"}
      </button>
    </form>
  );
}
