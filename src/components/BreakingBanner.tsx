import Link from "next/link";
import type { StoryCard } from "@/lib/queries";
import { storyHref } from "./Story";

export function BreakingBanner({ story }: { story: StoryCard }) {
  return (
    <div className="bg-brand text-white">
      <Link href={storyHref(story)} className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 hover:underline">
        <span className="flex shrink-0 items-center gap-1.5 rounded-sm bg-white px-2 py-0.5 text-xs font-black uppercase tracking-wider text-brand">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-brand" /> Breaking
        </span>
        <span className="truncate font-bold">{story.title}</span>
      </Link>
    </div>
  );
}
