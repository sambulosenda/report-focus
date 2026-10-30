"use client";

import { useActionState, useId } from "react";
import { signUp } from "@/actions/newsletter";
import { cn } from "@/lib/utils";

/** Email sign-up. "row" sits on white pages; "dark" sits on a teal card. */
export function NewsletterForm({ list = "morning-focus", variant = "row", cta = "Sign up" }: { list?: string; variant?: "row" | "dark"; cta?: string }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const id = useId();
  if (state?.ok) {
    return (
      <p role="status" className={cn("text-[15px] font-semibold", variant === "dark" ? "text-white" : "text-ok")}>
        {state.ok}
      </p>
    );
  }
  return (
    <form action={action} className={cn("flex flex-wrap gap-2.5", variant === "row" && "md:flex-nowrap")}>
      <input type="hidden" name="list" value={list} />
      <label htmlFor={id} className={cn(variant === "row" ? "w-full text-[13px] font-semibold md:sr-only" : "sr-only")}>
        Email address
      </label>
      <input
        id={id}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? `${id}-error` : undefined}
        className={cn(
          "h-[46px] min-w-0 flex-[1_1_220px] rounded-md border px-3.5 text-base text-ink outline-none md:text-[15px]",
          variant === "dark" ? "h-10 border-transparent bg-white" : "border-[#9ca3af] bg-white focus:border-ink",
        )}
      />
      <button
        disabled={pending}
        className={cn(
          "h-[46px] w-full rounded-md bg-brand px-[22px] text-[15px] font-extrabold text-white hover:bg-brand-dark disabled:opacity-60 md:w-auto",
          variant === "dark" && "h-10 w-full text-sm md:w-full",
        )}
      >
        {pending ? "Signing up…" : cta}
      </button>
      {state?.error && (
        <p id={`${id}-error`} role="alert" className={cn("w-full text-sm font-semibold", variant === "dark" ? "text-on-teal-pink" : "text-brand")}>
          {state.error}
        </p>
      )}
    </form>
  );
}

export function NewsletterBand() {
  return (
    <section aria-labelledby="morning-focus" className="mx-4 rounded-[10px] border border-line px-4 py-[18px] md:mx-0 md:rounded-none md:border-x-0 md:px-0 md:py-0">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-8 md:gap-y-4 md:px-6 md:py-7">
        <div>
          <h2 id="morning-focus" className="headline text-[22px] md:text-[28px]">The Morning Focus</h2>
          <p className="mt-1 text-sm text-muted md:text-[15px]">The five stories you need before 8 a.m., every weekday.</p>
        </div>
        <div className="md:flex-[0_1_460px]">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

export function NewsletterCard({ label = "The Morning Focus", title, text, list = "morning-focus", id }: { label?: string; title?: string; text: string; list?: string; id?: string }) {
  return (
    <section id={id} aria-label={title ?? label} className="rounded-lg bg-teal p-[18px] text-white md:rounded-[10px] md:p-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-on-teal-pink">{label}</p>
      {title && <p className="headline mt-1.5 text-[22px] text-white">{title}</p>}
      <p className="mb-3 mt-2 text-[15px] leading-[1.45] text-on-teal">{text}</p>
      <NewsletterForm list={list} variant="dark" cta="Sign up free" />
    </section>
  );
}
