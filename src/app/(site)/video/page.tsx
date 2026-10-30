import type { Metadata } from "next";
import { VideoWatch } from "@/components/VideoWatch";
import { storiesOfKind } from "@/lib/queries";
import { pageMeta } from "@/lib/seo";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = pageMeta({ title: "Video", description: "Watch the latest video from Report Focus News.", path: "/video" });

/** Video hub: the newest video in the player, then the rest. */
export default async function VideoHub() {
  const videos = await storiesOfKind(["video"], 13);
  const [first, ...rest] = videos;
  if (!first) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="headline text-3xl">No videos yet</h1>
        <p className="mt-3 text-muted">Published videos will appear here.</p>
      </div>
    );
  }
  const full = await db.select({ videoUrl: articles.videoUrl }).from(articles).where(eq(articles.id, first.id)).get();
  return (
    <>
      <h1 className="sr-only">Video</h1>
      <VideoWatch
        headingLevel="h2"
        video={{ ...first, videoUrl: full?.videoUrl ?? null, categoryName: first.category?.name }}
        upNext={rest.slice(0, 5)}
        more={rest.slice(5)}
      />
    </>
  );
}
