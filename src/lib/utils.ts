import slugifyLib from "slugify";

export function slugify(input: string) {
  return slugifyLib(input, { lower: true, strict: true, trim: true }).slice(0, 90) || "story";
}

export function readingTime(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

export function timeAgo(date: Date | null | undefined) {
  if (!date) return "";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(date);
}

/** Dates and times on the site are shown in the newsroom's time zone, not the server's. */
export const SITE_TIMEZONE = process.env.SITE_TIMEZONE ?? "America/New_York";

export function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: SITE_TIMEZONE });
}

export function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: SITE_TIMEZONE });
}

export function formatTime(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: SITE_TIMEZONE });
}

export function formatDateTime(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: SITE_TIMEZONE,
  });
}

/** Calendar days from today to `d` in the site time zone: 0 is today, 1 tomorrow, -1 yesterday. */
export function dayOffset(d: Date, now = new Date()) {
  const key = (x: Date) => {
    const [y, m, day] = x.toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE }).split("-").map(Number);
    return Date.UTC(y, m - 1, day) / 864e5;
  };
  return Math.round(key(d) - key(now));
}

/** A ?page= value as a whole number from 1 to 10,000. Anything else means page 1. */
export function pageParam(value: string | undefined) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}

/** First line of a Markdown text as plain words, cut at a word boundary near `max` characters. */
export function excerpt(text: string, max = 120) {
  const line = (text.split(/\n\s*\n|\n/).find((l) => l.trim()) ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>\-*\s]+|[*_`~]/g, "")
    .trim();
  if (line.length <= max) return line;
  const cut = line.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : max).trimEnd()}…`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function siteUrl(path = "") {
  return `${(process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
