import { deleteLiveUpdate, pinLiveUpdate, addLiveUpdate } from "@/actions/live";
import { liveUpdatesFor } from "@/lib/queries";
import { formatTime, timeAgo } from "@/lib/utils";
import { ActionForm } from "./ActionForm";
import { ConfirmButton } from "./ConfirmButton";
import { btnBrand, inputClass } from "./ui";

/** Post and manage the timeline on a live story. Sits under the story editor. */
export async function LiveUpdatesPanel({ articleId, publicUrl }: { articleId: number; publicUrl?: string }) {
  const updates = await liveUpdatesFor(articleId);
  return (
    <section aria-labelledby="live-panel" className="mx-auto max-w-[1360px] px-4 pb-10 md:px-6">
      <div className="rounded-xl border border-line bg-white p-5 md:px-8 md:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="live-panel" className="inline-flex items-center gap-2 text-base font-extrabold">
            <span aria-hidden className="live-dot h-2 w-2 rounded-full bg-brand" />
            Live updates
          </h2>
          {publicUrl && (
            <a href={publicUrl} target="_blank" className="text-[13px] font-bold text-teal hover:underline">
              Open the live page ↗
            </a>
          )}
        </div>
        <ActionForm action={addLiveUpdate} resetOnSuccess className="mt-4 grid gap-3">
          <input type="hidden" name="articleId" value={articleId} />
          <label className="flex flex-col gap-1.5 text-[13px] font-bold">
            Update headline (optional)
            <input name="title" maxLength={200} placeholder="Warnings now cover six counties" className={`${inputClass} font-normal`} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold">
            Update
            <textarea name="body" required rows={4} placeholder="What happened, in a few sentences. Markdown works here too." className={`${inputClass} font-serif text-base font-normal`} />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPinned" className="h-[18px] w-[18px] accent-teal" />
              Pin to the top of the timeline
            </label>
            <button className={btnBrand}>Post update</button>
          </div>
        </ActionForm>
        <ol className="mt-6">
          {updates.length === 0 && <li className="border-t border-line py-4 text-sm text-muted">No updates yet. The first one you post appears on the live page straight away.</li>}
          {updates.map((u) => (
            <li key={u.id} className="flex flex-col gap-2 border-t border-line py-4 sm:flex-row sm:gap-4">
              <div className="w-24 flex-none text-sm">
                <p className="font-extrabold tabular">{formatTime(u.createdAt)}</p>
                <p className="text-xs text-muted">{timeAgo(u.createdAt)}</p>
              </div>
              <div className="min-w-0 flex-1">
                {u.isPinned && <p className="text-[11px] font-extrabold tracking-[0.08em] text-teal">PINNED</p>}
                {u.title && <p className="font-serif text-lg font-bold">{u.title}</p>}
                <p className="whitespace-pre-line text-sm text-ink-2">{u.body}</p>
                <p className="mt-1 text-xs text-muted">{u.author ?? "Former staff"}</p>
              </div>
              <div className="flex flex-none items-start gap-3 text-[13px] font-bold">
                <form action={pinLiveUpdate}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="articleId" value={articleId} />
                  <input type="hidden" name="pin" value={u.isPinned ? "0" : "1"} />
                  <button className="text-teal hover:underline">{u.isPinned ? "Unpin" : "Pin"}</button>
                </form>
                <form action={deleteLiveUpdate}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="articleId" value={articleId} />
                  <ConfirmButton message="Delete this update? Readers will no longer see it." className="text-brand-dark hover:underline">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
