"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/actions/auth";
import { cn } from "@/lib/utils";

/** A form wired to a server action that returns { ok } or { error }, with inline feedback. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={cn(className, pending && "opacity-70")}>
      {children}
      {state?.error && <p role="alert" className="mt-3 text-sm font-semibold text-brand-dark">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{state.ok}</p>}
      {state?.link && <CopyLink key={state.link} link={state.link} />}
    </form>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex gap-2">
      <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Sign-in link" className="h-9 min-w-0 flex-1 border border-line bg-mist px-2 font-mono text-xs" />
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true), () => {})}
        className="h-9 border border-[#9ca3af] px-3 text-xs font-bold text-teal"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
