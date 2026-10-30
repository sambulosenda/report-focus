"use client";

import { useActionState, useState } from "react";
import { login } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const field = "h-[46px] rounded-lg border border-[#9ca3af] px-3 text-base font-normal outline-none focus:border-teal";
  return (
    <form action={action} className="mt-[18px] flex flex-col gap-[18px]">
      <input type="hidden" name="next" value={next ?? ""} />
      {state?.error && (
        <p role="alert" className="rounded-lg border border-[#f3b7bf] bg-[#fdecee] px-3 py-2.5 text-sm text-[#8a0f22]">
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Work email
        <input name="email" type="email" required autoComplete="username" className={field} />
      </label>
      <div className="flex flex-col gap-1.5 text-sm font-bold">
        <span className="flex justify-between">
          <label htmlFor="login-pw">Password</label>
          <button type="button" onClick={() => setForgot((f) => !f)} aria-expanded={forgot} className="text-[13px] font-semibold text-teal hover:underline">
            Forgot password?
          </button>
        </span>
        <span className="flex h-[46px] items-center rounded-lg border border-[#9ca3af] pl-3 pr-1 focus-within:border-teal">
          <input id="login-pw" name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="min-w-0 flex-1 text-base font-normal outline-none" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="h-[38px] px-2.5 text-[13px] font-bold text-teal">
            {show ? "Hide" : "Show"}
            <span className="sr-only"> password</span>
          </button>
        </span>
        {forgot && <p className="text-[13px] font-normal text-muted">Ask a newsroom admin to set a new password for you from the Staff page.</p>}
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <input type="checkbox" name="remember" defaultChecked className="h-5 w-5 accent-teal" />
        Keep me signed in on this device
      </label>
      <button disabled={pending} className="h-12 rounded-lg bg-teal text-base font-extrabold text-white hover:bg-teal-hover disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
