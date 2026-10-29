"use client";

import { useActionState, useEffect, useRef } from "react";
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
    </form>
  );
}
