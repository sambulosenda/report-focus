import Link from "next/link";
import type { StoryCard } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { videoEmbedUrl } from "@/lib/video";
import { SectionTitle, StoryImage, VideoCard, storyHref } from "./Story";
import { AutoplaySwitch, VideoPlayer } from "./VideoPlayer";

type Video = {
  title: string;
  summary: string;
  /** Description or transcript, shown under the player. */
  body?: string;
  videoUrl: string | null;
  videoDuration: string | null;
  heroImage: string | null;
  publishedAt: Date | null;
  categoryName?: string | null;
};

/** The watch page: dark player band with Up next, then more videos. */
export function VideoWatch({ video, upNext, more, moreTitle = "More videos", headingLevel = "h1" }: { video: Video; upNext: StoryCard[]; more: StoryCard[]; moreTitle?: string; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  // Only an uploaded file can tell us it has ended, so the Autoplay switch is shown for those alone.
  const nativeFile = !!video.videoUrl && !videoEmbedUrl(video.videoUrl);
  const body = video.body?.trim();
  return (
    <>
      <section className="bg-teal-deep text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-4 pb-8 pt-5 md:px-6 md:pt-7 lg:flex-row lg:items-start">
          <div className="min-w-0 lg:flex-[999_1_640px]">
            <div className="-mx-4 md:mx-0">
              <VideoPlayer src={video.videoUrl} poster={video.heroImage} title={video.title} nextHref={upNext[0] ? storyHref(upNext[0]) : undefined} />
            </div>
            <div className="mt-[18px] flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.06em] text-on-teal-pink">
                {[video.categoryName, video.videoDuration].filter(Boolean).join(" · ")}
              </span>
              <Heading className="font-serif text-2xl font-bold leading-[1.15] text-white md:text-[32px]">{video.title}</Heading>
              {video.summary && <p className="max-w-[720px] text-base leading-[1.55] text-on-teal">{video.summary}</p>}
              <p className="text-[13px] text-on-teal-muted">
                <time dateTime={video.publishedAt?.toISOString()}>{formatDate(video.publishedAt)}</time>
              </p>
            </div>
          </div>
          {upNext.length > 0 && (
            <aside className="min-w-0 lg:flex-[1_1_300px]" aria-labelledby="up-next">
              <div className="mb-2 flex items-center justify-between">
                <h2 id="up-next" className="text-lg font-extrabold">Up next</h2>
                {nativeFile && <AutoplaySwitch />}
              </div>
              <ol>
                {upNext.map((v) => (
                  <li key={v.id} className="border-t border-teal-line">
                    <Link href={storyHref(v)} className="story-link group flex gap-3 py-3 text-white">
                      <span className="relative block w-32 flex-none">
                        <StoryImage story={v} />
                        {v.videoDuration && (
                          <span className="absolute bottom-1 right-1 rounded-[3px] bg-black/80 px-[5px] py-0.5 text-[11px] font-bold">{v.videoDuration}</span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.05em] text-on-teal-pink">{v.category?.name ?? "Video"}</span>
                        <span className="story-title font-serif text-base font-bold leading-[1.28]">{v.title}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>
      </section>
      {body && (
        <section aria-labelledby="about-video" className="mx-auto max-w-[1280px] px-4 pt-10 md:px-6">
          <SectionTitle id="about-video" className="mb-5">
            About this video
          </SectionTitle>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
        </section>
      )}
      {more.length > 0 && (
        <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-10 md:px-6">
          <SectionTitle className="mb-5">{moreTitle}</SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((v) => (
              <VideoCard key={v.id} story={v} dark={false} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
