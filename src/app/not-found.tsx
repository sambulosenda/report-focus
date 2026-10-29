import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <Link href="/"><Logo /></Link>
        <h1 className="headline mt-8 text-4xl">We couldn’t find that page</h1>
        <p className="mt-3 text-muted">The story may have moved or been taken down.</p>
        <Link href="/" className="mt-6 inline-block rounded bg-navy px-5 py-2.5 font-bold text-white">Go to the homepage</Link>
      </div>
    </div>
  );
}
