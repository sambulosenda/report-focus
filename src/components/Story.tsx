import Link from "next/link";
import type { StoryCard } from "@/lib/queries";
import { cn, timeAgo } from "@/lib/utils";

export const storyHref = (s: Pick<StoryCard, "slug" | "category">) => `/${s.category?.slug ?? "news"}/${s.slug}`;

export function StoryImage({ story, className, priority }: { story: StoryCard; className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden rounded bg-mist", className)}>
      {story.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.heroImage}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div
          className="flex h-full w-full items-end p-3 text-xs font-bold uppercase tracking-widest text-white/90"
          style={{ background: `linear-gradient(135deg, ${story.category?.color ?? "#0a1a33"}, #0a1a33)` }}
        >
          {story.category?.name}
        </div>
      )}
    </div>
  );
}

export function Kicker({ story, className }: { story: StoryCard; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wide", className)}>
      {story.isBreaking ? (
        <span className="flex items-center gap-1 text-brand">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-brand" /> Breaking
        </span>
      ) : story.category ? (
        <span style={{ color: story.category.color }}>{story.category.name}</span>
      ) : null}
      <span className="font-medium normal-case tracking-normal text-muted">{timeAgo(story.publishedAt)}</span>
    </div>
  );
}

export function LeadStory({ story }: { story: StoryCard }) {
  return (
    <Link href={storyHref(story)} className="story-link group block">
      <StoryImage story={story} priority />
      <Kicker story={story} className="mt-3" />
      <h2 className="story-title headline mt-1.5 text-3xl md:text-[2.6rem]">{story.title}</h2>
      {story.summary && <p className="mt-3 text-lg leading-relaxed text-muted">{story.summary}</p>}
    </Link>
  );
}

export function CardStory({ story, size = "md" }: { story: StoryCard; size?: "sm" | "md" }) {
  return (
    <Link href={storyHref(story)} className="story-link group block">
      <StoryImage story={story} />
      <Kicker story={story} className="mt-2.5" />
      <h3 className={cn("story-title headline mt-1", size === "md" ? "text-xl" : "text-base")}>{story.title}</h3>
      {size === "md" && story.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{story.summary}</p>}
    </Link>
  );
}

export function RowStory({ story }: { story: StoryCard }) {
  return (
    <Link href={storyHref(story)} className="story-link group flex gap-4">
      <StoryImage story={story} className="w-32 shrink-0 sm:w-40" />
      <div className="min-w-0">
        <Kicker story={story} />
        <h3 className="story-title mt-1 text-[1.05rem] font-bold leading-snug">{story.title}</h3>
      </div>
    </Link>
  );
}

export function TextStory({ story, index }: { story: StoryCard; index?: number }) {
  return (
    <Link href={storyHref(story)} className="story-link group flex gap-3 py-3">
      {index !== undefined && <span className="w-6 shrink-0 text-2xl font-black leading-none text-brand">{index + 1}</span>}
      <div>
        <h3 className="story-title font-bold leading-snug">{story.title}</h3>
        <p className="mt-1 text-xs text-muted">{timeAgo(story.publishedAt)}</p>
      </div>
    </Link>
  );
}

export function SectionHeading({ title, href, color }: { title: string; href?: string; color?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between border-b-2 border-ink pb-2">
      <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
        <span className="inline-block h-4 w-1.5 rounded-sm" style={{ background: color ?? "#d0142c" }} />
        {href ? <Link href={href} className="hover:underline">{title}</Link> : title}
      </h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-brand hover:underline">
          More {title} →
        </Link>
      )}
    </div>
  );
}
