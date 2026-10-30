import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { isPendingHash, userForLink } from "@/lib/invites";
import { SetPasswordForm } from "./SetPasswordForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose your password", robots: { index: false }, referrer: "no-referrer" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await userForLink(token);
  const invited = user && isPendingHash(user.passwordHash);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-mist px-4 py-12">
      <Link href="/" aria-label="Report Focus News home" className="mb-1.5">
        <Logo className="text-[32px] leading-[1.1] sm:text-[40px]" />
      </Link>
      <p className="mb-7 text-[13px] font-extrabold tracking-[0.12em] text-teal">NEWSROOM</p>
      <div className="w-full max-w-[400px] border border-line bg-white p-6 sm:p-8">
        {user ? (
          <>
            <h1 className="text-[22px] font-extrabold">{invited ? `Welcome, ${user.name.split(" ")[0]}` : "Choose a new password"}</h1>
            <p className="mt-1.5 text-sm text-muted">
              {invited ? "Choose a password to finish setting up your newsroom account." : "Your old password stops working once you save this one."} You’ll sign in with{" "}
              <strong className="text-ink">{user.email}</strong>.
            </p>
            <SetPasswordForm token={token} email={user.email} />
          </>
        ) : (
          <>
            <h1 className="text-[22px] font-extrabold">This link no longer works</h1>
            <p className="mt-1.5 text-sm text-muted">
              Sign-in links work once and last 7 days. Ask a newsroom admin to make you a new one from the Staff page.
            </p>
            <Link href="/login" className="mt-5 flex h-12 items-center justify-center bg-teal text-base font-extrabold text-white hover:bg-teal-hover hover:no-underline">
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
