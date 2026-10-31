"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

type Bookmark = { id: number; title: string; href: string; savedAt: number };
const KEY = "report-focus:saved-articles:v1";
const CHANGE = "report-focus:bookmarks-changed";

function read() {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) notify(); };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE, notify);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(CHANGE, notify); };
}
function parse(raw: string | null | undefined): Bookmark[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<number>();
    return value.filter((item): item is Bookmark => {
      if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || typeof item.title !== "string" ||
        typeof item.href !== "string" || !/^\/(?![/\\])/.test(item.href) || item.href.includes("\\") ||
        /[\u0000-\u001f]/.test(item.href) || !Number.isFinite(item.savedAt) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 500);
  } catch { return []; }
}
function useBookmarks() {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  const bookmarks = useMemo(() => parse(raw), [raw]);
  return { bookmarks, ready: raw !== undefined };
}
function changeBookmark(article: Pick<Bookmark, "id" | "title" | "href">, save: boolean) {
  const current = parse(read()).filter((item) => item.id !== article.id);
  if (save && current.length >= 500) throw new Error("Your saved list is full. Remove a story before saving another.");
  const next = save ? [{ ...article, savedAt: Date.now() }, ...current] : current;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); }
  catch { throw new Error("Your browser couldn’t save this change. Allow site storage and try again."); }
  window.dispatchEvent(new Event(CHANGE));
}

export function SaveArticleButton({ id, title, href }: Pick<Bookmark, "id" | "title" | "href">) {
  const { bookmarks, ready } = useBookmarks();
  const [error, setError] = useState("");
  const saved = bookmarks.some((item) => item.id === id);
  return (
    <div className="my-2">
      <button type="button" disabled={!ready} aria-pressed={saved}
        onClick={() => { try { changeBookmark({ id, title, href }, !saved); setError(""); } catch (e) { setError((e as Error).message); } }}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-teal hover:underline disabled:opacity-50">
        <svg aria-hidden="true" width="18" height="20" viewBox="0 0 18 20" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M3 2h12v16l-6-4-6 4V2Z" /></svg>
        {saved ? "Saved — remove" : "Save article"}
      </button>
      <span role="status" className="sr-only">{ready && saved ? "Article saved on this device." : ""}</span>
      {error && <p role="alert" className="text-sm text-brand">{error}</p>}
    </div>
  );
}

export function SavedArticles() {
  const { bookmarks, ready } = useBookmarks();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  if (!ready) return <p role="status" className="mt-8 text-muted">Loading saved articles…</p>;
  return (
    <div className="mt-8">
      <p role="status" className="sr-only">{notice}</p>
      {error && <p role="alert" className="mb-4 text-sm text-brand">{error}</p>}
      {bookmarks.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {bookmarks.map((article) => (
            <li key={article.id} className="flex flex-wrap items-start justify-between gap-3 py-5">
              <Link href={article.href} className="headline min-w-0 flex-[1_1_240px] text-[24px] leading-tight hover:text-teal">{article.title}</Link>
              <button type="button" aria-label={`Remove ${article.title} from saved articles`}
                onClick={() => { try { changeBookmark(article, false); setError(""); setNotice(`${article.title} removed.`); } catch (e) { setError((e as Error).message); } }}
                className="min-h-11 text-sm font-bold text-teal hover:underline">Remove</button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-t-2 border-ink py-6">
          <h2 className="headline text-2xl">Your reading list starts here</h2>
          <p className="mt-2 text-ink-2">Tap “Save article” on a story to come back to it later.</p>
          <Link href="/latest" className="mt-5 inline-flex min-h-11 items-center bg-teal px-5 font-bold text-white">Explore the latest news</Link>
        </div>
      )}
    </div>
  );
}
