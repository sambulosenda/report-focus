import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { unsubscribe } from "@/actions/newsletter";
import { db } from "@/db";
import { newsletterSignups } from "@/db/schema";
import { listInfo } from "@/lib/newsletters";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

// The link in an email only shows a button: mail scanners open links, and they shouldn't unsubscribe anyone.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const signup = /^[a-f0-9]{32}$/.test(token) ? await db.select().from(newsletterSignups).where(eq(newsletterSignups.token, token)).get() : undefined;
  const info = signup ? await listInfo(signup.list) : null;
  const name = info?.name ?? "this newsletter";

  return (
    <div className="mx-auto max-w-[640px] px-4 pb-20 pt-12 md:px-6 md:pt-16">
      {!signup ? (
        <>
          <h1 className="headline text-[32px] leading-[1.1] md:text-[40px]">We couldn’t find that sign-up</h1>
          <p className="mt-4 text-[17px] leading-normal text-ink-2">The link may be incomplete. Use the unsubscribe link at the bottom of any of our emails.</p>
        </>
      ) : signup.unsubscribedAt ? (
        <>
          <h1 className="headline text-[32px] leading-[1.1] md:text-[40px]">You’re unsubscribed</h1>
          <p className="mt-4 text-[17px] leading-normal text-ink-2">
            {signup.email} won’t get {name} any more. Changed your mind? <Link href={`/newsletters#${signup.list}`} className="font-bold text-teal hover:underline">Sign up again</Link>.
          </p>
        </>
      ) : (
        <>
          <h1 className="headline text-[32px] leading-[1.1] md:text-[40px]">Unsubscribe from {name}?</h1>
          <p className="mt-4 text-[17px] leading-normal text-ink-2">We’ll stop sending it to {signup.email}.</p>
          <form action={unsubscribe} className="mt-6">
            <input type="hidden" name="token" value={signup.token} />
            <button className="h-12 bg-teal px-6 text-base font-bold text-white hover:bg-teal-hover">Unsubscribe</button>
          </form>
        </>
      )}
    </div>
  );
}
