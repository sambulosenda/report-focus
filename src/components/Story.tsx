import Link from "next/link";
import { KIND_LABEL } from "@/db/schema";
import type { StoryCard } from "@/lib/queries";
import { cn, timeAgo } from "@/lib/utils";
import { PlayIcon } from "./icons";

export const storyHref = (s: Pick<StoryCard, "slug" | "category">) => `/${s.category?.slug ?? "news"}/${s.slug}`;

/** The red label above a headline: Live, Analysis, Opinion and so on, otherwise the section name. */
export function kickerText(story: Pick<StoryCard, "kind" | "category" | "videoDuration">) {
  const section = story.category?.name ?? "News";
  if (story.kind === "live") return `${section} · Live updates`;
  if (story.kind === "video") return story.videoDuration ? `Video · ${story.videoDuration}` : "Video";
  if (story.kind === "news") return section;
  return KIND_LABEL[story.kind];
}

export function Kicker({ story, className, dark }: { story: StoryCard; className?: string; dark?: boolean }) {
  return <span className={cn("kicker block", dark && "text-on-teal-pink", className)}>{kickerText(story)}</span>;
}

const RATIO = { "16/9": "aspect-video", "3/2": "aspect-[3/2]", "4/3": "aspect-[4/3]" } as const;

export function StoryImage({
  story,
  ratio = "16/9",
  className,
  priority,
}: {
  story: StoryCard;
  ratio?: keyof typeof RATIO;
  className?: string;
  priority?: boolean;
}) {
  // No picture means no picture: a story without art runs as text rather than behind a placeholder.
  if (!story.heroImage) return null;
  return (
    <span className={cn("relative block overflow-hidden bg-mist", RATIO[ratio], className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={story.heroImage} alt={story.heroAlt ?? ""} loading={priority ? "eager" : "lazy"} className="h-full w-full object-cover" />
    </span>
  );
}

/** Small play badge with the running time, laid over a video thumbnail. */
export function Duration({ story, className }: { story: StoryCard; className?: string }) {
  if (story.kind !== "video") return null;
  return (
    <span className={cn("absolute bottom-2 left-2 inline-flex items-center gap-1.5 bg-black/80 px-2 py-1 text-xs font-bold text-white md:bottom-2.5 md:left-2.5", className)}>
      <PlayIcon />
      {story.videoDuration ?? "Video"}
      <span className="sr-only"> video</span>
    </span>
  );
}

/** A section heading set under a thin ink rule, newspaper style. */
export function SectionTitle({ children, className, as: Tag = "h2", id, ruled = true }: { children: React.ReactNode; className?: string; as?: "h1" | "h2"; id?: string; ruled?: boolean }) {
  return (
    <Tag id={id} className={cn("block text-lg font-extrabold tracking-[-0.01em] text-ink", ruled && "border-t-2 border-ink pt-2", className)}>
      {children}
    </Tag>
  );
}

export function SectionHeader({ title, href, more = "More", className }: { title: string; href?: string; more?: string; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-baseline justify-between border-t-2 border-ink pt-2 md:mb-3.5", className)}>
      <SectionTitle ruled={false}>{title}</SectionTitle>
      {href && (
        <Link href={href} className="inline-flex min-h-11 items-center text-[13px] font-bold text-ink hover:underline md:min-h-0">
          {more}
        </Link>
      )}
    </div>
  );
}

/** Headline stack item: kicker, serif headline and time. The first one can carry a picture. */
export function StackStory({ story, withImage, size = "md" }: { story: StoryCard; withImage?: boolean; size?: "md" | "lg" }) {
  return (
    <Link href={storyHref(story)} className="story-link group flex flex-col gap-1.5 border-b border-line py-3.5 first:pt-0">
      {withImage && <StoryImage story={story} className="mb-0.5" />}
      <Kicker story={story} />
      <span className={cn("story-title headline", size === "lg" ? "text-[22px] leading-[1.2]" : "text-lg leading-[1.28]")}>{story.title}</span>
      <time dateTime={story.publishedAt?.toISOString()} className="text-xs text-muted">{timeAgo(story.publishedAt)}</time>
    </Link>
  );
}

/** Phone headline row: text on the left, a small picture on the right. */
export function ThumbStory({ story }: { story: StoryCard }) {
  return (
    <Link href={storyHref(story)} className="story-link group flex gap-3 border-t border-line py-3.5">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <Kicker story={story} className="text-[11px]" />
        <span className="story-title headline text-lg leading-[1.28]">{story.title}</span>
        <time dateTime={story.publishedAt?.toISOString()} className="text-xs text-muted">{timeAgo(story.publishedAt)}</time>
      </span>
      {story.heroImage && (
        <span className="relative flex-none">
          <StoryImage story={story} ratio="4/3" className="w-[104px]" />
        </span>
      )}
    </Link>
  );
}

/** Numbered list used for Top Stories and Most Read. */
export function NumberedList({ stories, numberSize = "md" }: { stories: StoryCard[]; numberSize?: "md" | "lg" }) {
  return (
    <ol className="mt-1">
      {stories.map((s, i) => (
        <li key={s.id} className="border-b border-line">
          <Link href={storyHref(s)} className={cn("story-link group flex gap-3", numberSize === "lg" ? "gap-3.5 py-3.5" : "py-3")}>
            <span aria-hidden className={cn("headline min-w-[18px] leading-none text-brand", numberSize === "lg" ? "text-[28px]" : "text-[22px]")}>
              {i + 1}
            </span>
            <span className="story-title headline text-base leading-[1.28]">{s.title}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Video card for the dark Trending videos band or the light video grid. */
export function VideoCard({ story, dark = true, className }: { story: StoryCard; dark?: boolean; className?: string }) {
  return (
    <Link href={storyHref(story)} className={cn("story-link group flex flex-col gap-1.5 md:gap-2", dark ? "text-white" : "text-ink", className)}>
      <span className="relative block">
        <StoryImage story={story} />
        <Duration story={story} />
      </span>
      <span className={cn("kicker block text-[11px] md:text-xs", dark && "text-on-teal-pink")}>{story.category?.name ?? "Video"}</span>
      <span className={cn("story-title font-headline text-base font-semibold leading-[1.28] md:text-lg", dark ? "text-white" : "text-ink")}>{story.title}</span>
    </Link>
  );
}

/** Picture on top, headline under it, then a time. Used in "More from" grids. */
export function CardStory({ story, ratio = "3/2", showKicker = false }: { story: StoryCard; ratio?: keyof typeof RATIO; showKicker?: boolean }) {
  return (
    <Link href={storyHref(story)} className="story-link group flex flex-col gap-2.5">
      <span className="relative block">
        <StoryImage story={story} ratio={ratio} />
        <Duration story={story} />
      </span>
      {showKicker && <Kicker story={story} />}
      <span className="story-title headline text-xl leading-[1.25]">{story.title}</span>
      <time dateTime={story.publishedAt?.toISOString()} className="text-xs text-muted">{timeAgo(story.publishedAt)}</time>
    </Link>
  );
}

/**
 * List row with kicker, headline, summary and meta on the left and a picture on the right.
 * Used for section rivers, search results and author pages.
 */
export function RiverStory({
  story,
  time,
  meta,
  title,
  imageWidth = "md:w-[180px]",
  imageFirst = false,
}: {
  story: StoryCard;
  time?: string;
  meta?: React.ReactNode;
  title?: React.ReactNode;
  imageWidth?: string;
  imageFirst?: boolean;
}) {
  return (
    <Link href={storyHref(story)} className="story-link group flex items-start gap-4 py-[18px] md:gap-5">
      {time && <span className="hidden w-[92px] flex-none pt-1 text-[13px] font-bold text-muted tabular md:block">{time}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Kicker story={story} />
        <span className="story-title headline text-lg leading-[1.25] md:text-[22px] md:leading-[1.22]">{title ?? story.title}</span>
        {story.summary && <span className="hidden text-[15px] leading-normal text-ink-2 sm:block">{story.summary}</span>}
        {(meta || time) && <span className="text-[13px] text-muted">{meta ?? <span className="md:hidden">{time}</span>}</span>}
      </span>
      {story.heroImage && (
        <span className={cn("relative w-[104px] flex-none sm:w-[140px]", imageWidth, imageFirst && "sm:order-first")}>
          <StoryImage story={story} ratio="3/2" />
          <span className="hidden sm:block">
            <Duration story={story} />
          </span>
        </span>
      )}
    </Link>
  );
}

export function OpinionStory({ story }: { story: StoryCard }) {
  return (
    <Link href={storyHref(story)} className="story-link group flex items-start border-t border-line py-3 first:border-t-0 md:border-0 md:py-0">
      <span className="flex flex-col gap-1 md:gap-1.5">
        <span className="kicker block text-[11px] md:text-xs">{KIND_LABEL[story.kind]}</span>
        <span className="story-title headline text-lg leading-[1.25] md:text-xl">{story.title}</span>
        <span className="text-xs text-muted md:text-[13px]">
          {story.author.name}
          {story.author.title && `, ${story.author.title}`}
        </span>
      </span>
    </Link>
  );
}

/** A homepage section block: heading, a lead story with a picture, then headline links. */
export function SectionBlock({ title, href, stories, layout = "stacked" }: { title: string; href: string; stories: StoryCard[]; layout?: "stacked" | "thumb" }) {
  const [lead, ...more] = stories;
  if (!lead) return null;
  return (
    <section className="flex flex-col">
      <SectionHeader title={title} href={href} more={`More ${title}`} />
      {layout === "stacked" ? (
        <Link href={storyHref(lead)} className="story-link group flex flex-col gap-2.5 pb-3">
          <StoryImage story={lead} />
          <span className="story-title headline text-[22px] leading-[1.2]">{lead.title}</span>
        </Link>
      ) : (
        <Link href={storyHref(lead)} className="story-link group flex items-start gap-3.5 pb-3">
          <StoryImage story={lead} ratio="4/3" className="w-[132px] flex-none" />
          <span className="story-title headline text-xl leading-[1.25]">{lead.title}</span>
        </Link>
      )}
      {more.map((s) => (
        <Link key={s.id} href={storyHref(s)} className="story-title headline border-t border-line py-[11px] text-base leading-[1.28]">
          {s.title}
        </Link>
      ))}
    </section>
  );
}
