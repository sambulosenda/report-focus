import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSignups } from "@/db/schema";
import { listInfo } from "@/lib/newsletters";

export const metadata: Metadata = { title: "Confirm your sign-up", robots: { index: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const signup = /^[a-f0-9]{32}$/.test(token) ? await db.select().from(newsletterSignups).where(eq(newsletterSignups.token, token)).get() : undefined;
  if (signup && !signup.unsubscribedAt) {
    await db
      .update(newsletterSignups)
      .set({ confirmedAt: new Date() })
      .where(and(eq(newsletterSignups.id, signup.id), isNull(newsletterSignups.confirmedAt)));
  }
  const info = signup ? await listInfo(signup.list) : null;

  return (
    <div className="mx-auto max-w-[640px] px-4 pb-20 pt-12 md:px-6 md:pt-16">
      {signup && !signup.unsubscribedAt ? (
        <>
          <h1 className="headline text-[32px] leading-[1.1] md:text-[40px]">You’re signed up</h1>
          <p className="mt-4 text-[17px] leading-normal text-ink-2">
            {info ? `${info.name} will arrive at ${signup.email}. ${info.description}` : `Your email ${signup.email} is confirmed.`}
          </p>
        </>
      ) : (
        <>
          <h1 className="headline text-[32px] leading-[1.1] md:text-[40px]">This link has expired</h1>
          <p className="mt-4 text-[17px] leading-normal text-ink-2">Sign up again and we’ll send you a new confirmation email.</p>
        </>
      )}
      <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-bold">
        <Link href="/" className="text-teal hover:underline">Go to the homepage</Link>
        <Link href="/newsletters" className="text-teal hover:underline">See all newsletters</Link>
      </p>
    </div>
  );
}
