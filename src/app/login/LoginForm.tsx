"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="text-sm font-semibold">Email</span>
        <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded border border-line px-3 py-2.5 outline-none focus:border-navy" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded border border-line px-3 py-2.5 outline-none focus:border-navy" />
      </label>
      {state?.error && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-brand-dark">{state.error}</p>}
      <button disabled={pending} className="w-full rounded bg-brand py-2.5 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
