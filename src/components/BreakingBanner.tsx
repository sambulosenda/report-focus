import Link from "next/link";
import type { StoryCard } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { storyHref } from "./Story";

export function BreakingBanner({ story }: { story: StoryCard }) {
  return (
    <div className="bg-brand text-white">
      <Link href={storyHref(story)} className="group mx-auto block max-w-[1280px] px-4 py-3 hover:no-underline md:flex md:flex-wrap md:items-center md:gap-x-3.5 md:gap-y-2 md:px-6 md:py-[11px]">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em] md:text-xs">
          Breaking<span className="md:hidden"> · {timeAgo(story.publishedAt)}</span>
        </span>
        <span className="mt-0.5 block text-[15px] font-bold leading-snug group-hover:underline md:mt-0 md:text-base">{story.title}</span>
        <span className="hidden text-[13px] md:ml-auto md:inline">{timeAgo(story.publishedAt)}</span>
      </Link>
    </div>
  );
}
