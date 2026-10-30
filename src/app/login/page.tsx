import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Newsroom sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/newsroom");
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-mist px-4 py-12">
      <Link href="/" aria-label="Report Focus News home" className="mb-1.5">
        <Logo className="text-[32px] leading-[1.1] sm:text-[40px]" />
      </Link>
      <p className="mb-7 text-[13px] font-extrabold tracking-[0.12em] text-teal">NEWSROOM</p>
      <div className="w-full max-w-[400px] border border-line bg-white p-6 sm:p-8">
        <h1 className="text-[22px] font-extrabold">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted">For Report Focus News staff.</p>
        <LoginForm next={next} />
      </div>
      <p className="mt-[22px] text-center text-sm text-muted">
        Looking for the news?{" "}
        <Link href="/" className="font-bold text-teal hover:underline">
          Go to the homepage
        </Link>
      </p>
    </main>
  );
}
