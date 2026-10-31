import { NewsletterForm } from "./NewsletterForm";

export function FollowCard({ list, title, description }: { list: string; title: string; description?: string }) {
  return (
    <section aria-label={title} className="my-6 border-t-2 border-teal bg-slate-50 px-4 py-5 md:px-5">
      <h2 className="headline text-[24px] leading-tight">{title}</h2>
      <p className="mb-4 mt-2 text-[15px] leading-normal text-ink-2">
        {description ?? "Get a weekday email when there’s new coverage. Confirm your email to start; unsubscribe at any time."}
      </p>
      <NewsletterForm list={list} cta="Follow by email" />
    </section>
  );
}
