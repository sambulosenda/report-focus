"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { deleteArticle, saveArticle, uploadImage } from "@/actions/articles";
import type { Article, Category, Media, Role } from "@/db/schema";
import { renderMarkdown } from "@/lib/markdown";
import { cn, readingTime } from "@/lib/utils";
import { StatusBadge, btnBrand, btnGhost, btnPrimary, inputClass } from "./ui";

type Props = {
  article?: Article;
  categories: Category[];
  library: Pick<Media, "id" | "url" | "alt">[];
  role: Role;
  publicUrl?: string;
};

function toLocalInput(d: Date | null | undefined) {
  if (!d) return "";
  const off = d.getTimezoneOffset() * 60e3;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function ArticleEditor({ article, categories, library, role, publicUrl }: Props) {
  const [state, action, pending] = useActionState(saveArticle, undefined);
  const editor = role !== "journalist";
  const [body, setBody] = useState(article?.body ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [hero, setHero] = useState(article?.heroImage ?? "");
  const [scheduleLocal, setScheduleLocal] = useState(
    article?.publishedAt && article.publishedAt > new Date() ? toLocalInput(article.publishedAt) : "",
  );
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [showLibrary, setShowLibrary] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const intentRef = useRef<HTMLInputElement>(null);
  // Record which action button was pressed in a hidden field, so it reliably reaches the server.
  const setIntent = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (intentRef.current) intentRef.current.value = e.currentTarget.value;
  };
  const status = article?.status ?? "draft";
  const isLive = status === "published";

  useEffect(() => {
    if (state?.savedAt) setDirty(false);
  }, [state?.savedAt]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    const save = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        formRef.current?.querySelector<HTMLButtonElement>('button[value="save"]')?.click();
      }
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("keydown", save);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("keydown", save);
    };
  }, [dirty]);

  function wrap(before: string, after = before, placeholder = "text") {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = body.slice(s, e) || placeholder;
    const next = body.slice(0, s) + before + selected + after + body.slice(e);
    setBody(next);
    setDirty(true);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  function linePrefix(prefix: string) {
    const el = bodyRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = body.lastIndexOf("\n", s - 1) + 1;
    setBody(body.slice(0, lineStart) + prefix + body.slice(lineStart));
    setDirty(true);
    requestAnimationFrame(() => el.focus());
  }

  async function onUpload(file: File, target: "hero" | "body") {
    setUploading(true);
    setUploadError(undefined);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadImage(fd);
    setUploading(false);
    if (res.error || !res.url) return setUploadError(res.error ?? "Upload failed.");
    if (target === "hero") setHero(res.url);
    else wrap(`![`, `](${res.url} "Caption")`, "Describe the image");
    setDirty(true);
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const scheduleIso = scheduleLocal ? new Date(scheduleLocal).toISOString() : "";

  const tools: { label: string; title: string; run: () => void }[] = [
    { label: "B", title: "Bold", run: () => wrap("**") },
    { label: "I", title: "Italic", run: () => wrap("_") },
    { label: "H2", title: "Heading", run: () => linePrefix("## ") },
    { label: "H3", title: "Subheading", run: () => linePrefix("### ") },
    { label: "❝", title: "Quote", run: () => linePrefix("> ") },
    { label: "•", title: "Bulleted list", run: () => linePrefix("- ") },
    { label: "1.", title: "Numbered list", run: () => linePrefix("1. ") },
    { label: "Link", title: "Link", run: () => wrap("[", "](https://)", "link text") },
  ];

  return (
    <form ref={formRef} action={action} onChange={() => setDirty(true)} className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {article && <input type="hidden" name="id" value={article.id} />}
      <input type="hidden" name="heroImage" value={hero} />
      <input type="hidden" name="publishAt" value={scheduleIso} />
      <input ref={intentRef} type="hidden" name="intent" defaultValue="save" />

      <div className="min-w-0 space-y-4">
        {state?.error && <p role="alert" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-brand-dark">{state.error}</p>}
        {state?.ok && <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{state.ok}</p>}
        {article?.editorNote && status === "draft" && (
          <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Note from the editor:</strong> {article.editorNote}
          </p>
        )}

        <div className="rounded-lg border border-line bg-white p-5">
          <label className="block">
            <span className="sr-only">Headline</span>
            <textarea
              name="title"
              required
              rows={2}
              defaultValue={article?.title}
              placeholder="Headline"
              className="headline w-full resize-none text-3xl outline-none placeholder:text-slate-300"
            />
          </label>
          <label className="mt-2 block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">Summary</span>
            <textarea
              name="summary"
              rows={2}
              maxLength={400}
              defaultValue={article?.summary}
              placeholder="One or two sentences that tell readers why this matters. Shown on the homepage and in search results."
              className="mt-1 w-full resize-none text-lg text-muted outline-none placeholder:text-slate-300"
            />
          </label>
        </div>

        <div className="rounded-lg border border-line bg-white">
          <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
            <div className="mr-2 flex rounded bg-mist p-0.5 text-sm font-semibold">
              {(["write", "preview"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded px-3 py-1 capitalize", tab === t && "bg-white shadow-sm")}>
                  {t}
                </button>
              ))}
            </div>
            {tab === "write" &&
              tools.map((t) => (
                <button key={t.title} type="button" title={t.title} aria-label={t.title} onClick={t.run} className="min-w-8 rounded px-2 py-1 text-sm font-bold hover:bg-mist">
                  {t.label}
                </button>
              ))}
            {tab === "write" && (
              <label className="cursor-pointer rounded px-2 py-1 text-sm font-bold hover:bg-mist" title="Insert image">
                Image
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], "body")} />
              </label>
            )}
            <span className="ml-auto text-xs text-muted">
              {words.toLocaleString()} words · {readingTime(body)} min read
            </span>
          </div>
          <textarea
            ref={bodyRef}
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Write the story here.\n\nUse ## for subheadings, > for quotes and - for lists. Leave a blank line between paragraphs."}
            className={cn("min-h-[480px] w-full resize-y p-5 font-serif text-[1.05rem] leading-relaxed outline-none", tab === "preview" && "hidden")}
          />
          {tab === "preview" && (
            <div className="article-body min-h-[480px] p-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(body || "_Nothing to preview yet._") }} />
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-lg border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Status</span>
            {article ? <StatusBadge article={article} /> : <span className="text-sm text-muted">New story</span>}
          </div>
          {dirty && <p className="text-xs font-semibold text-amber-700">Unsaved changes</p>}
          {publicUrl && (
            <Link href={publicUrl} target="_blank" className="block text-sm font-semibold text-brand hover:underline">View live story ↗</Link>
          )}
          <div className="grid gap-2 pt-1">
            <button onClick={setIntent} value="save" disabled={pending} className={btnGhost}>
              {pending ? "Saving…" : isLive ? "Save changes" : "Save draft"}
            </button>
            {!editor && status !== "review" && (
              <button onClick={setIntent} value="submit" disabled={pending} className={btnPrimary}>Submit for review</button>
            )}
            {!editor && status === "review" && <p className="text-xs text-muted">With the editors. You can still make changes until it’s published.</p>}
            {editor && (
              <>
                <label className="mt-1 block text-xs font-semibold text-muted">
                  Schedule (optional)
                  <input type="datetime-local" value={scheduleLocal} onChange={(e) => setScheduleLocal(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
                <button onClick={setIntent} value="publish" disabled={pending} className={btnBrand}>
                  {scheduleLocal && new Date(scheduleLocal) > new Date() ? "Schedule" : isLive ? "Update live story" : "Publish now"}
                </button>
                {isLive && <button onClick={setIntent} value="unpublish" disabled={pending} className={btnGhost}>Unpublish</button>}
              </>
            )}
          </div>
          {editor && status === "review" && (
            <div className="border-t border-line pt-3">
              <label className="block text-xs font-semibold text-muted">
                Note to the writer
                <textarea name="editorNote" rows={2} defaultValue={article?.editorNote ?? ""} className={`${inputClass} mt-1`} />
              </label>
              <button onClick={setIntent} value="return" disabled={pending} className={`${btnGhost} mt-2 w-full`}>Return to writer</button>
            </div>
          )}
          <p className="text-[11px] text-muted">Tip: press Ctrl/⌘ + S to save.</p>
        </div>

        <div className="space-y-4 rounded-lg border border-line bg-white p-5">
          <label className="block text-sm font-bold">
            Section
            <select name="categoryId" defaultValue={article?.categoryId ?? ""} className={`${inputClass} mt-1`}>
              <option value="">Choose a section</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Tags
            <input name="tags" defaultValue={article?.tags} placeholder="election, economy, climate" className={`${inputClass} mt-1 font-normal`} />
            <span className="mt-1 block text-xs font-normal text-muted">Separate with commas.</span>
          </label>
          {editor && (
            <label className="block text-sm font-bold">
              URL slug
              <input name="slug" defaultValue={article?.slug} placeholder="made-from-headline" className={`${inputClass} mt-1 font-mono font-normal`} />
            </label>
          )}
          {editor && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Placement</legend>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="isBreaking" defaultChecked={article?.isBreaking} className="mt-0.5 accent-brand" />
                <span><strong className="text-brand">Breaking news</strong><br /><span className="text-xs text-muted">Shows the red banner on the homepage for 24 hours.</span></span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="isFeatured" defaultChecked={article?.isFeatured} className="mt-0.5 accent-navy" />
                <span><strong>Top story</strong><br /><span className="text-xs text-muted">Eligible for the homepage lead slot.</span></span>
              </label>
            </fieldset>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-white p-5">
          <p className="text-sm font-bold">Main image</p>
          {hero ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero} alt="" className="aspect-video w-full rounded object-cover" />
              <button type="button" onClick={() => { setHero(""); setDirty(true); }} className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-bold shadow">
                Remove
              </button>
            </div>
          ) : (
            <div className="grid aspect-video place-items-center rounded border-2 border-dashed border-line text-sm text-muted">No image</div>
          )}
          <div className="flex gap-2">
            <label className={`${btnGhost} flex-1 cursor-pointer text-center`}>
              {uploading ? "Uploading…" : "Upload"}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], "hero")} />
            </label>
            <button type="button" onClick={() => setShowLibrary((s) => !s)} className={`${btnGhost} flex-1`}>Library</button>
          </div>
          {uploadError && <p className="text-xs font-semibold text-brand-dark">{uploadError}</p>}
          {showLibrary && (
            <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto">
              {library.length === 0 && <p className="col-span-3 text-xs text-muted">No images uploaded yet.</p>}
              {library.map((m) => (
                <button key={m.id} type="button" onClick={() => { setHero(m.url); setShowLibrary(false); setDirty(true); }} className="overflow-hidden rounded ring-navy hover:ring-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.alt} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <label className="block text-xs font-semibold text-muted">
            Caption and credit
            <input name="heroCaption" defaultValue={article?.heroCaption ?? ""} placeholder="What’s in the photo. (Photo: Name/Agency)" className={`${inputClass} mt-1`} />
          </label>
        </div>

        {article && (editor || (status === "draft" && !isLive)) && (
          <div className="rounded-lg border border-red-200 bg-white p-5">
            {editor && status !== "archived" && (
              <button onClick={setIntent} value="archive" disabled={pending} className="mb-2 w-full text-left text-sm font-semibold text-muted hover:text-ink">
                Archive story
              </button>
            )}
            <button
              type="submit"
              formAction={deleteArticle}
              onClick={(e) => {
                if (!confirm("Delete this story permanently? This can’t be undone.")) e.preventDefault();
              }}
              className="text-sm font-semibold text-brand-dark hover:underline"
            >
              Delete story
            </button>
          </div>
        )}
      </aside>
    </form>
  );
}
