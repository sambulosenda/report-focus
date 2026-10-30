"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { deleteArticle, saveArticle, uploadImage } from "@/actions/articles";
import { CheckIcon, ChevronLeftIcon, EyeIcon } from "@/components/icons";
import { KIND_LABEL, KINDS, type Article, type Category, type Kind, type Media, type Role } from "@/db/schema";
import { renderMarkdown } from "@/lib/markdown";
import { cn, readingTime } from "@/lib/utils";
import { StatusBadge, SwitchButton, btnGhost, inputClass, labelClass } from "./ui";

type Props = {
  article?: Article;
  categories: Category[];
  library: Pick<Media, "id" | "url" | "alt">[];
  role: Role;
  authorName: string;
  publicUrl?: string;
};

const HEADLINE_MAX = 110;
const TZ = process.env.NEXT_PUBLIC_SITE_TIMEZONE ?? "America/New_York";

function toLocalInput(d: Date | null | undefined) {
  if (!d) return "";
  const off = d.getTimezoneOffset() * 60e3;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

const clock = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

export function ArticleEditor({ article, categories, library, role, authorName, publicUrl }: Props) {
  const [state, action, pending] = useActionState(saveArticle, undefined);
  const editor = role !== "journalist";
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [categoryId, setCategoryId] = useState(article?.categoryId ? String(article.categoryId) : "");
  const [kind, setKind] = useState<Kind>(article?.kind ?? "news");
  const [tags, setTags] = useState<string[]>(article?.tags ? article.tags.split(",").map((t) => t.trim()).filter(Boolean) : []);
  const [tagDraft, setTagDraft] = useState("");
  const [hero, setHero] = useState(article?.heroImage ?? "");
  const [credit, setCredit] = useState(article?.heroCredit ?? "");
  const [alt, setAlt] = useState(article?.heroAlt ?? "");
  const [videoUrl, setVideoUrl] = useState(article?.videoUrl ?? "");
  const [videoDuration, setVideoDuration] = useState(article?.videoDuration ?? "");
  const [breaking, setBreaking] = useState(article?.isBreaking ?? false);
  const [featured, setFeatured] = useState(article?.isFeatured ?? false);
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [scheduleLocal, setScheduleLocal] = useState(article?.publishedAt && article.publishedAt > new Date() ? toLocalInput(article.publishedAt) : "");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(article ? article.updatedAt : null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [showLibrary, setShowLibrary] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const intentRef = useRef<HTMLInputElement>(null);
  // Counts edits, so a save that finishes after newer typing does not mark that typing as saved.
  const editVersion = useRef(0);
  const submittedVersion = useRef(0);
  // Record which action button was pressed in a hidden field, so it reliably reaches the server.
  const setIntent = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (intentRef.current) intentRef.current.value = e.currentTarget.value;
  };
  const status = article?.status ?? "draft";
  const isLive = status === "published";
  const scheduled = !!scheduleLocal && new Date(scheduleLocal) > new Date();

  useEffect(() => {
    if (state?.savedAt) {
      if (editVersion.current === submittedVersion.current) setDirty(false);
      setSavedAt(new Date(state.savedAt));
    }
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

  const touch = () => {
    editVersion.current += 1;
    setDirty(true);
  };

  function wrap(before: string, after = before, placeholder = "text") {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = body.slice(s, e) || placeholder;
    setBody(body.slice(0, s) + before + selected + after + body.slice(e));
    touch();
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
    touch();
    requestAnimationFrame(() => el.focus());
  }

  function insertBlock(text: string) {
    const el = bodyRef.current;
    const at = el?.selectionStart ?? body.length;
    const before = body.slice(0, at).replace(/\s*$/, "");
    const next = `${before}${before ? "\n\n" : ""}${text}\n\n${body.slice(at).replace(/^\s*/, "")}`;
    setBody(next);
    touch();
    requestAnimationFrame(() => el?.focus());
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
    else insertBlock(`![Describe the image](${res.url} "Caption. Photo: Name/Agency")`);
    touch();
  }

  function addTag(raw: string) {
    const t = raw.trim().replace(/,+$/, "");
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) setTags([...tags, t]);
    setTagDraft("");
    touch();
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const scheduleIso = scheduleLocal ? new Date(scheduleLocal).toISOString() : "";
  const headCount = title.trim().length;
  const section = categories.find((c) => String(c.id) === categoryId);
  const previewSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);

  const checks = [
    { label: "Headline", ok: headCount >= 20 && headCount <= HEADLINE_MAX },
    { label: "Summary", ok: summary.trim().length > 0 },
    { label: "Lead image and alt text", ok: !!hero && alt.trim().length > 0 },
    { label: "Photo credit", ok: !hero || credit.trim().length > 0 },
    { label: "Section and tags", ok: !!categoryId && tags.length > 0 },
    { label: kind === "video" ? "Video link" : "Body text", ok: kind === "video" ? videoUrl.trim().length > 0 : words >= 50 },
  ];
  const missing = checks.filter((c) => !c.ok).length;

  const tools: { label: string; text: string; run: () => void }[] = [
    { text: "B", label: "Bold", run: () => wrap("**") },
    { text: "I", label: "Italic", run: () => wrap("_") },
    { text: "H", label: "Subheading", run: () => linePrefix("## ") },
    { text: "“", label: "Quote", run: () => insertBlock("> Quote goes here.\n>\n> — Who said it") },
    { text: "•", label: "Bulleted list", run: () => linePrefix("- ") },
    { text: "Link", label: "Insert link", run: () => wrap("[", "](https://)", "link text") },
    { text: "Box", label: "Insert a What to know box", run: () => insertBlock("> **What to know**\n>\n> - First point\n> - Second point\n> - Third point") },
  ];

  const publishLabel = scheduled ? "Schedule" : isLive ? "Update live story" : breaking ? "Publish as breaking" : "Publish now";
  const field = "h-10 rounded-lg border border-line-2 bg-white px-2.5 text-sm text-ink outline-none focus:border-teal";

  return (
    <form ref={formRef} action={action} onChange={touch} onSubmit={() => (submittedVersion.current = editVersion.current)}>
      {article && <input type="hidden" name="id" value={article.id} />}
      <input type="hidden" name="heroImage" value={hero} />
      <input type="hidden" name="publishAt" value={scheduleIso} />
      <input type="hidden" name="tags" value={tags.join(", ")} />
      <input type="hidden" name="kind" value={kind} />
      {editor && breaking && <input type="hidden" name="isBreaking" value="on" />}
      {editor && featured && <input type="hidden" name="isFeatured" value="on" />}
      <input ref={intentRef} type="hidden" name="intent" defaultValue="save" />

      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-2.5 md:px-6">
          <Link href="/newsroom" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-ink hover:underline">
            <ChevronLeftIcon size={16} />
            Dashboard
          </Link>
          <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
          {article ? <StatusBadge article={article} /> : <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-extrabold text-[#374151]">New story</span>}
          <span role="status" className="inline-flex items-center gap-1.5 text-[13px] text-muted">
            {pending ? (
              "Saving…"
            ) : dirty ? (
              <span className="font-semibold text-[#7a4a00]">Unsaved changes</span>
            ) : savedAt ? (
              <>
                <CheckIcon size={14} color="#2f7a46" />
                Saved {clock(savedAt)}
              </>
            ) : (
              "Not saved yet"
            )}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {publicUrl ? (
              <Link href={publicUrl} target="_blank" className={cn(btnGhost, "gap-1.5 border-[#9ca3af]")}>
                <EyeIcon />
                View live
              </Link>
            ) : (
              <button type="button" onClick={() => setTab(tab === "preview" ? "write" : "preview")} aria-pressed={tab === "preview"} className={cn(btnGhost, "gap-1.5 border-[#9ca3af]")}>
                <EyeIcon />
                {tab === "preview" ? "Back to writing" : "Preview"}
              </button>
            )}
            <button onClick={setIntent} value="save" disabled={pending} className={cn(btnGhost, "border-[#9ca3af]")}>
              {isLive ? "Save" : "Save draft"}
            </button>
            {!editor && status !== "review" && !isLive && (
              <button onClick={setIntent} value="submit" disabled={pending} className="h-10 rounded-lg bg-teal px-[18px] text-sm font-extrabold text-white hover:bg-teal-hover disabled:opacity-50">
                Submit for review
              </button>
            )}
            {editor && (
              <>
                {status === "review" && (
                  <button onClick={setIntent} value="return" disabled={pending} className={cn(btnGhost, "border-[#9ca3af]")}>
                    Request changes
                  </button>
                )}
                <button
                  onClick={setIntent}
                  value="publish"
                  disabled={pending}
                  className={cn("h-10 rounded-lg px-[18px] text-sm font-extrabold text-white disabled:opacity-50", breaking && !scheduled ? "bg-brand hover:bg-brand-dark" : "bg-teal hover:bg-teal-hover")}
                >
                  {publishLabel}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1360px] flex-col gap-6 p-4 md:p-6 lg:flex-row lg:items-start">
        <main className="flex min-w-0 flex-col gap-4 lg:flex-[999_1_640px]">
          {state?.error && (
            <p role="alert" className="rounded-[10px] border border-[#f3b7bf] bg-[#fdecee] px-4 py-3 text-sm font-semibold text-[#8a0f22]">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p role="status" className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {state.ok}
            </p>
          )}
          {!editor && status === "review" && (
            <p className="rounded-[10px] border border-line bg-white px-4 py-3 text-sm text-ink-2">With the editors. You can keep making changes until it’s published.</p>
          )}
          {article?.editorNote && (status === "draft" || status === "review") && (
            <div className="flex items-start gap-3 rounded-[10px] border border-[#f1d08a] bg-[#fff7e6] px-4 py-3.5 text-sm leading-normal">
              <span aria-hidden className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal text-xs font-extrabold text-white">
                Ed
              </span>
              <div>
                <p className="font-bold">{status === "draft" ? "The editor asked for changes" : "Note on this story"}</p>
                <p className="text-ink-2">“{article.editorNote}”</p>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-[18px] rounded-xl border border-line bg-white p-5 md:px-8 md:py-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="ed-section" className={labelClass}>
                Section
              </label>
              <select
                id="ed-section"
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={cn("h-9 rounded-lg border border-line-2 bg-white px-2.5 text-sm font-bold", categoryId ? "text-brand" : "text-muted")}
              >
                <option value="">Choose a section</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label htmlFor="ed-kind" className="text-[13px] text-muted">
                Story type
              </label>
              <select id="ed-kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="h-9 rounded-lg border border-line-2 bg-white px-2.5 text-sm text-ink">
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ed-headline" className={cn(labelClass, "mb-1.5")}>
                Headline
              </label>
              <textarea
                id="ed-headline"
                name="title"
                required
                rows={2}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write a clear, specific headline"
                aria-describedby="ed-headline-help"
                className="headline w-full resize-none border-b-2 border-line bg-transparent pb-2.5 pt-1 text-[28px] leading-[1.12] outline-none placeholder:text-[#c4c8ce] focus:border-teal md:text-[40px]"
              />
              <div id="ed-headline-help" className="mt-1.5 flex justify-between text-xs">
                <span className="text-muted">Aim for 60 to 90 characters.</span>
                <span className={cn("font-bold tabular", headCount > HEADLINE_MAX ? "text-[#b00020]" : "text-muted")}>
                  {headCount} / {HEADLINE_MAX}
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="ed-dek" className={cn(labelClass, "mb-1.5")}>
                Summary
              </label>
              <textarea
                id="ed-dek"
                name="summary"
                rows={2}
                maxLength={400}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One or two sentences that tell readers why this matters. Shown on the homepage, in search and when shared."
                className="w-full resize-y rounded-lg border border-line px-3 py-2.5 text-lg leading-normal text-ink-2 outline-none placeholder:text-[#9ca3af] focus:border-teal"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(labelClass, "mr-1")}>By</span>
              <span className="inline-flex h-8 items-center rounded-full bg-mist px-3 text-sm font-semibold">{authorName}</span>
            </div>
          </section>

          {kind === "video" && (
            <section className="flex flex-col gap-3.5 rounded-xl border border-line bg-white p-5 md:px-8 md:py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-extrabold">Video</h2>
                <span className="text-[13px] text-muted">An uploaded MP4 link, or a YouTube or Vimeo link</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <label className="flex flex-col gap-1.5 text-[13px] font-bold">
                  Video link
                  <input name="videoUrl" type="text" inputMode="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://" className={cn(field, "font-normal")} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-bold">
                  Length
                  <input name="videoDuration" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} placeholder="1:38" className={cn(field, "font-normal tabular")} />
                </label>
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3.5 rounded-xl border border-line bg-white p-5 md:px-8 md:py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-extrabold">{kind === "video" ? "Poster image" : "Lead image"}</h2>
              <span className="text-[13px] text-muted">Shown on the homepage and when shared</span>
            </div>
            {hero ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hero} alt={alt} className="block aspect-video w-full rounded-lg object-cover" />
                <div className="absolute right-2.5 top-2.5 flex gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-white/95 px-3 text-[13px] font-bold shadow">
                    {uploading ? "Uploading…" : "Replace"}
                    <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], "hero")} />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setHero("");
                      touch();
                    }}
                    className="h-9 rounded-lg bg-white/95 px-3 text-[13px] font-bold shadow"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[16/7] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-line-2 text-sm text-muted">
                No image yet
                <div className="flex gap-2">
                  <label className={cn(btnGhost, "cursor-pointer")}>
                    {uploading ? "Uploading…" : "Upload"}
                    <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], "hero")} />
                  </label>
                  <button type="button" onClick={() => setShowLibrary((s) => !s)} aria-expanded={showLibrary} className={btnGhost}>
                    Choose from library
                  </button>
                </div>
              </div>
            )}
            {uploadError && <p className="text-sm font-semibold text-brand">{uploadError}</p>}
            {showLibrary && !hero && (
              <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
                {library.length === 0 && <p className="col-span-full text-sm text-muted">No images uploaded yet.</p>}
                {library.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setHero(m.url);
                      if (!alt && m.alt) setAlt(m.alt);
                      setShowLibrary(false);
                      touch();
                    }}
                    className="overflow-hidden rounded ring-teal hover:ring-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.alt} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <label className="flex flex-col gap-1.5 text-[13px] font-bold">
                Caption
                <input name="heroCaption" defaultValue={article?.heroCaption ?? ""} placeholder="What’s in the picture" className={cn(field, "font-normal")} />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-bold">
                Photo credit
                <input
                  name="heroCredit"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="Photo: Name/Agency"
                  aria-invalid={!!hero && !credit.trim()}
                  className={cn(field, "font-normal", hero && !credit.trim() && "border-[#b00020]")}
                />
                {hero && !credit.trim() && <span className="text-xs font-semibold text-[#b00020]">A credit is required before publishing.</span>}
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">
              Alt text
              <input name="heroAlt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" className={cn(field, "font-normal")} />
              <span className="text-xs font-normal text-muted">Describe the image for readers who use screen readers.</span>
            </label>
          </section>

          <section className="overflow-hidden rounded-xl border border-line bg-white">
            <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
              <div className="mr-2 flex rounded-lg bg-mist p-0.5 text-sm font-semibold">
                {(["write", "preview"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={cn("rounded-md px-3 py-1 capitalize", tab === t && "bg-white shadow-sm")}>
                    {t}
                  </button>
                ))}
              </div>
              {tab === "write" &&
                tools.map((t) => (
                  <button key={t.label} type="button" title={t.label} aria-label={t.label} onClick={t.run} className="h-9 min-w-9 rounded-md px-2 text-sm font-extrabold text-ink hover:bg-mist">
                    {t.text}
                  </button>
                ))}
              {tab === "write" && (
                <label className="inline-flex h-9 cursor-pointer items-center rounded-md px-2 text-sm font-extrabold hover:bg-mist" title="Insert photo">
                  Photo
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], "body")} />
                </label>
              )}
              <span className="ml-auto text-xs text-muted tabular">
                {words.toLocaleString()} words · {readingTime(body)} min read
              </span>
            </div>
            <label htmlFor="ed-body" className="sr-only">
              Story text
            </label>
            <textarea
              id="ed-body"
              ref={bodyRef}
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Write the story here.\n\nUse ## for subheadings, > for quotes and - for lists. Leave a blank line between paragraphs."}
              className={cn("block min-h-[520px] w-full max-w-[760px] resize-y px-5 py-6 font-serif text-lg leading-[1.7] text-[#1f2937] outline-none md:px-8 md:text-xl", tab === "preview" && "hidden")}
            />
            {tab === "preview" && (
              <div className="min-h-[520px] px-5 py-6 md:px-8">
                <h1 className="headline mb-4 text-[32px] leading-[1.1]">{title || "Untitled story"}</h1>
                <div className="article-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(body || "_Nothing to preview yet._") }} />
              </div>
            )}
          </section>
        </main>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[78px] lg:flex-[1_1_320px]">
          <section className="rounded-xl border border-line bg-white p-[18px]" aria-labelledby="ready">
            <h2 id="ready" className="mb-3 text-[15px] font-extrabold">
              Ready to publish
            </h2>
            <ul className="flex flex-col gap-[9px]">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5 text-sm">
                  <span aria-hidden className={cn("inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-xs font-extrabold", c.ok ? "bg-[#e3f1e7] text-[#1f6b3a]" : "bg-[#fdecee] text-[#b00020]")}>
                    {c.ok ? "✓" : "!"}
                  </span>
                  <span>{c.label}</span>
                  <span className="sr-only">{c.ok ? "done" : "needs attention"}</span>
                </li>
              ))}
            </ul>
            <p className={cn("mt-3 text-[13px] font-bold", missing ? "text-[#b00020]" : "text-[#1f6b3a]")}>
              {missing ? `${missing} item${missing === 1 ? "" : "s"} need${missing === 1 ? "s" : ""} attention before publishing` : "Everything is ready"}
            </p>
          </section>

          <section className="flex flex-col gap-3.5 rounded-xl border border-line bg-white p-[18px]" aria-labelledby="publishing">
            <h2 id="publishing" className="text-[15px] font-extrabold">
              Publishing
            </h2>
            {editor ? (
              <div className="flex items-center justify-between gap-3">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">Breaking news</span>
                  <span className="text-xs text-muted">Shows the red banner across the site</span>
                </span>
                <SwitchButton
                  type="button"
                  on={breaking}
                  label="Breaking news"
                  onClick={() => {
                    setBreaking(!breaking);
                    touch();
                  }}
                />
              </div>
            ) : (
              <p className="text-[13px] text-muted">An editor decides when this publishes and where it goes on the homepage.</p>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold">Live updates</span>
                <span className="text-xs text-muted">Adds a timeline readers can follow</span>
              </span>
              <SwitchButton
                type="button"
                on={kind === "live"}
                label="Live updates"
                onClick={() => {
                  setKind(kind === "live" ? "news" : "live");
                  touch();
                }}
              />
            </div>
            {editor && (
              <>
                <label className="flex flex-col gap-1.5 text-[13px] font-bold">
                  Homepage placement
                  <select
                    value={featured ? "top" : "section"}
                    onChange={(e) => {
                      setFeatured(e.target.value === "top");
                      touch();
                    }}
                    className={cn(field, "font-normal")}
                  >
                    <option value="top">Top stories (can lead the homepage)</option>
                    <option value="section">Section only</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-bold">
                  Publish at (optional)
                  <input type="datetime-local" value={scheduleLocal} onChange={(e) => setScheduleLocal(e.target.value)} className={cn(field, "font-normal tabular")} />
                  <span className="text-xs font-normal text-muted">Leave empty to publish now. A future time schedules the story.</span>
                </label>
              </>
            )}
            {isLive && editor && (
              <button onClick={setIntent} value="unpublish" disabled={pending} className={cn(btnGhost, "w-full")}>
                Unpublish
              </button>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-[18px]" aria-labelledby="tags">
            <h2 id="tags" className="text-[15px] font-extrabold">
              Tags
            </h2>
            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <li key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-mist pl-3 pr-1 text-[13px] font-semibold">
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      onClick={() => {
                        setTags(tags.filter((x) => x !== t));
                        touch();
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor="ed-tag" className="sr-only">
              Add a tag
            </label>
            <input
              id="ed-tag"
              value={tagDraft}
              onChange={(e) => (e.target.value.endsWith(",") ? addTag(e.target.value) : setTagDraft(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagDraft);
                }
              }}
              onBlur={() => tagDraft && addTag(tagDraft)}
              placeholder="Add a tag and press Enter"
              className={field}
            />
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-[18px]" aria-labelledby="social">
            <h2 id="social" className="text-[15px] font-extrabold">
              Search and social
            </h2>
            <div className="overflow-hidden rounded-lg border border-line">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero} alt="" className="block aspect-[1.91/1] w-full object-cover" />
              ) : (
                <div className="aspect-[1.91/1] bg-mist" />
              )}
              <div className="px-3 py-2.5">
                <p className="text-xs uppercase text-muted">reportfocus.news</p>
                <p className="line-clamp-2 text-sm font-bold leading-snug">{title || "Your headline"}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{summary || "Your summary"}</p>
              </div>
            </div>
            {editor ? (
              <label className="flex flex-col gap-1.5 text-[13px] font-bold">
                Web address
                <span className="flex items-center rounded-lg border border-line-2 bg-mist text-sm font-normal focus-within:border-teal">
                  <span className="pl-2.5 text-muted">{section?.slug ?? "section"}/</span>
                  <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={previewSlug || "made-from-headline"} className="h-10 min-w-0 flex-1 rounded-r-lg bg-white px-1.5 font-mono text-[13px] outline-none" />
                </span>
              </label>
            ) : (
              <p className="text-xs text-muted">
                Web address: {section?.slug ?? "section"}/{article?.slug ?? previewSlug}
              </p>
            )}
          </section>

          {editor && (status === "review" || status === "draft") && (
            <section className="flex flex-col gap-2 rounded-xl border border-line bg-white p-[18px]">
              <label htmlFor="ed-note" className="text-[15px] font-extrabold">
                Note to the writer
              </label>
              <textarea id="ed-note" name="editorNote" rows={3} defaultValue={article?.editorNote ?? ""} placeholder="What needs to change before this can publish" className={inputClass} />
              <span className="text-xs text-muted">Sent with “Request changes”.</span>
            </section>
          )}

          {article && (editor || status === "draft") && (
            <section className="flex flex-col items-start gap-2 rounded-xl border border-[#f3b7bf] bg-white p-[18px]">
              {editor && status !== "archived" && (
                <button onClick={setIntent} value="archive" disabled={pending} className="text-sm font-semibold text-muted hover:text-ink">
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
            </section>
          )}
          <p className="text-[11px] text-muted">Tip: press Ctrl or ⌘ + S to save.</p>
        </aside>
      </div>
    </form>
  );
}
