"use client";

import { useActionState, useState } from "react";
import { acceptSignInLink } from "@/actions/auth";

export function SetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(acceptSignInLink, undefined);
  const [show, setShow] = useState(false);
  const field = "h-[46px] border border-[#9ca3af] px-3 text-base font-normal outline-none focus:border-teal";
  return (
    <form action={action} className="mt-[18px] flex flex-col gap-[18px]">
      <input type="hidden" name="token" value={token} />
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
      {state?.error && (
        <p role="alert" className="border border-[#f3b7bf] bg-[#fdecee] px-3 py-2.5 text-sm text-[#8a0f22]">
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        New password
        <input name="password" type={show ? "text" : "password"} required minLength={10} autoComplete="new-password" className={field} />
        <span className="text-[13px] font-normal text-muted">At least 10 characters.</span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Type it again
        <input name="confirm" type={show ? "text" : "password"} required minLength={10} autoComplete="new-password" className={field} />
      </label>
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-5 w-5 accent-teal" />
        Show passwords
      </label>
      <button disabled={pending} className="h-12 bg-teal text-base font-extrabold text-white hover:bg-teal-hover disabled:opacity-60">
        {pending ? "Saving…" : "Save and sign in"}
      </button>
    </form>
  );
}
