import type { Metadata } from "next";
import { SavedArticles } from "@/components/SavedArticles";

export const metadata: Metadata = { title: "Saved articles", robots: { index: false, follow: true } };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-[880px] px-4 pb-16 pt-8 md:px-6">
      <h1 className="headline text-[36px] md:text-[44px]">Saved articles</h1>
      <p className="mt-3 text-base leading-normal text-ink-2">Your reading list is saved in this browser. No account needed. Clearing site data removes your list; an internet connection is needed to open stories.</p>
      <SavedArticles />
    </div>
  );
}
