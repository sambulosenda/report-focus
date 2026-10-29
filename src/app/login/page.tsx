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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Link href="/"><Logo dark /></Link>
        <div>
          <p className="headline text-4xl">The newsroom.</p>
          <p className="mt-3 max-w-md text-white/70">Write, edit and publish stories for Report Focus. Drafts save as you work and editors review before anything goes live.</p>
        </div>
        <p className="text-sm text-white/50">Staff access only.</p>
      </div>
      <div className="grid place-items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden"><Logo /></Link>
          <h1 className="headline mt-8 text-3xl lg:mt-0">Sign in</h1>
          <p className="mt-2 text-muted">Use your newsroom account.</p>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
