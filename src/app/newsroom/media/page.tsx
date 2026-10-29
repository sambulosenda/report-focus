import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { deleteMedia } from "@/actions/admin";
import { db } from "@/db";
import { media, users } from "@/db/schema";
import { MediaUploader } from "@/components/newsroom/MediaUploader";
import { PageHeader } from "@/components/newsroom/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Image library" };

export default async function MediaPage() {
  const user = await requireUser();
  const items = await db
    .select({ id: media.id, url: media.url, alt: media.alt, createdAt: media.createdAt, by: users.name })
    .from(media)
    .leftJoin(users, eq(users.id, media.uploadedBy))
    .orderBy(desc(media.createdAt))
    .limit(200);
  return (
    <>
      <PageHeader title="Image library" description="Photos uploaded by the newsroom. JPEG, PNG, WebP, GIF or AVIF up to 8 MB." />
      <div className="space-y-6 p-6">
        <MediaUploader />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {items.length === 0 && <p className="col-span-full text-sm text-muted">No images yet.</p>}
          {items.map((m) => (
            <figure key={m.id} className="overflow-hidden rounded-lg border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt} className="aspect-video w-full object-cover" loading="lazy" />
              <figcaption className="space-y-1 p-3 text-xs">
                <p className="line-clamp-2 font-semibold">{m.alt || "No description"}</p>
                <p className="text-muted">{m.by ?? "Unknown"} · {timeAgo(m.createdAt)}</p>
                <input readOnly value={m.url} className="w-full rounded bg-mist px-2 py-1 font-mono text-[11px]" aria-label="Image URL" />
                {hasRole(user, "editor") && (
                  <form action={deleteMedia}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="font-semibold text-brand-dark hover:underline">Remove from library</button>
                  </form>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}
