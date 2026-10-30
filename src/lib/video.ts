/** Turns a YouTube or Vimeo page link into its embed URL. Other links are treated as video files. */
export function videoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const youtube = (id: string | undefined | null) => {
      if (!id) return null;
      // Keep a start time from links like ?t=90 or ?t=1m30s.
      const t = u.searchParams.get("t") ?? u.searchParams.get("start");
      const m = t?.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
      const start = m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
      return `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`;
    };
    if (host === "youtu.be") return youtube(u.pathname.slice(1).split("/")[0]);
    if (host === "youtube.com" || host === "m.youtube.com") {
      return youtube(u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]);
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/^\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}
