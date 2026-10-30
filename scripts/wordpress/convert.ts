/**
 * Turns WordPress post HTML into the Markdown the story editor uses.
 * Story bodies render raw HTML as text, so nothing HTML-only may survive the conversion.
 */
import { decodeHTML } from "entities";
import TurndownService from "turndown";

export function decodeEntities(s: string) {
  return decodeHTML(s);
}

export function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|h\d|li)>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\[\/?[a-z_-]+[^\]]*\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The story's opening words for a summary, leaving out picture captions and embeds. */
export function leadText(html: string) {
  return htmlToText(
    html
      .replace(/\[caption[^\]]*\][\s\S]*?\[\/caption\]/gi, "")
      .replace(/<(figure|figcaption|iframe|table)[\s\S]*?<\/\1>/gi, "")
      .replace(/\[embed[^\]]*\][\s\S]*?\[\/embed\]/gi, ""),
  ).replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
}

/** Shortens text to at most `max` characters on a word boundary. */
export function clip(s: string, max: number) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,;:.–—-]+$/, "")}…`;
}

const BLOCK_START = /^<\/?(p|div|h[1-6]|ul|ol|li|blockquote|figure|table|pre|hr|iframe)[\s>/]/i;

/**
 * The classic editor saves paragraphs as blank lines and line breaks as plain newlines. This is a small
 * version of WordPress's wpautop(). Block-editor posts (marked with <!-- wp: comments) already have tags.
 */
export function autop(html: string) {
  return html
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => (BLOCK_START.test(chunk) ? chunk : `<p>${chunk.replace(/\n/g, "<br>")}</p>`))
    .join("\n");
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"))?.slice(2).find((v) => v != null) ?? "";

/** WordPress shortcodes that would otherwise show up as [brackets] in the story. */
export function expandShortcodes(html: string) {
  return (
    html
      // [caption]<img …> The caption[/caption] → a figure with a caption.
      .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi, (_m, inner: string) => {
        const img = inner.match(/(<a[^>]*>\s*)?<img[^>]*>(\s*<\/a>)?/i)?.[0] ?? "";
        const caption = inner.replace(img, "").trim();
        return `<figure>${img}<figcaption>${caption}</figcaption></figure>`;
      })
      // [embed]https://…[/embed] and bare [video src="…"] → the address on its own line.
      .replace(/\[embed[^\]]*\]([\s\S]*?)\[\/embed\]/gi, (_m, url: string) => `<p>${url.trim()}</p>`)
      .replace(/\[(video|audio)([^\]]*)\](?:[\s\S]*?\[\/\1\])?/gi, (m, _t, attrs: string) => {
        const src = attr(` ${attrs}`, "src") || attr(` ${attrs}`, "mp4") || attr(` ${attrs}`, "mp3");
        return src ? `<p>${src}</p>` : "";
      })
      // Galleries and other plugin shortcodes can't be shown here; drop them rather than print them.
      .replace(/\[\/?(gallery|playlist|contact-form-7|contact-form|wpforms|vc_[a-z_]+|et_pb_[a-z_]+|fusion_[a-z_]+)[^\]]*\]/gi, "")
  );
}

export type ConvertOptions = {
  /** Links to these hosts become site-relative, so they land on the old-address redirects. */
  oldHosts: string[];
};

function makeTurndown({ oldHosts }: ConvertOptions) {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
    hr: "---",
  });
  td.remove(["script", "style", "noscript", "form", "input", "button", "select", "textarea"]);

  const localise = (href: string) => {
    try {
      const u = new URL(href);
      if (oldHosts.includes(u.hostname.replace(/^www\./, ""))) return `${u.pathname}${u.search}${u.hash}` || "/";
    } catch {}
    return href;
  };
  const clean = (s: string) => s.replace(/\s+/g, " ").replace(/([[\]])/g, "\\$1").trim();
  const imgMarkdown = (img: HTMLElement, caption = "") => {
    // Lazy-loading plugins put a placeholder in src and the real picture in data-src.
    const src = img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || img.getAttribute("src") || "";
    if (!src) return "";
    const alt = clean(img.getAttribute("alt") ?? "");
    const title = caption.replace(/"/g, "'").replace(/\s+/g, " ").trim();
    return `![${alt}](${src.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")}${title ? ` "${title}"` : ""})`;
  };

  td.addRule("figure", {
    filter: (node) => node.nodeName === "FIGURE" && !!node.querySelector("img"),
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const caption = el.querySelector("figcaption")?.textContent ?? "";
      const imgs = Array.from(el.querySelectorAll("img"));
      return `\n\n${imgs.map((img, i) => imgMarkdown(img as HTMLElement, i === imgs.length - 1 ? caption : "")).join("\n\n")}\n\n`;
    },
  });
  td.addRule("image", {
    filter: "img",
    replacement: (_c, node) => imgMarkdown(node as HTMLElement),
  });
  // A picture wrapped in a link to its own full-size file is just the picture.
  td.addRule("linkedImage", {
    filter: (node) => node.nodeName === "A" && node.childNodes.length === 1 && node.firstChild?.nodeName === "IMG",
    replacement: (content) => content,
  });
  td.addRule("link", {
    filter: (node) => node.nodeName === "A" && !!node.getAttribute("href"),
    replacement: (content, node) => {
      const href = localise((node as HTMLElement).getAttribute("href")!.trim());
      if (!content.trim()) return "";
      return `[${content}](${href.replace(/ /g, "%20").replace(/\)/g, "%29")})`;
    },
  });
  // A quote's <cite> becomes the "— Name" line the story page shows as its attribution.
  td.addRule("cite", {
    filter: (node) => node.nodeName === "CITE" && !!node.parentNode && node.parentNode.nodeName === "BLOCKQUOTE",
    replacement: (content) => (content.trim() ? `\n\n— ${content.trim()}\n\n` : ""),
  });
  // Embedded players (YouTube, maps…) become their address, which the reader can follow.
  td.addRule("iframe", {
    filter: ["iframe", "video", "audio", "embed", "object"],
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const src = el.getAttribute("src") ?? el.querySelector("source")?.getAttribute("src") ?? el.getAttribute("data") ?? "";
      const url = src.startsWith("//") ? `https:${src}` : src;
      return /^https?:/i.test(url) ? `\n\n${url.replace(/youtube(-nocookie)?\.com\/embed\/([\w-]+).*/, "youtube.com/watch?v=$2")}\n\n` : "";
    },
  });
  // Tables have no Markdown form in the editor; keep their text as one line per row.
  td.addRule("tableRow", {
    filter: "tr",
    replacement: (_c, node) => {
      const cells = Array.from((node as HTMLElement).querySelectorAll("th,td")).map((c) => clean(c.textContent ?? ""));
      return cells.some(Boolean) ? `\n\n${cells.filter(Boolean).join(" · ")}\n\n` : "";
    },
  });
  return td;
}

export function htmlToMarkdown(html: string, opts: ConvertOptions) {
  const blockEditor = /<!--\s*wp:/.test(html);
  const expanded = expandShortcodes(html.replace(/<!--[\s\S]*?-->/g, ""));
  const prepared = blockEditor ? expanded : autop(expanded);
  const md = makeTurndown(opts)
    .turndown(prepared)
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^(\s*)(-|\d+\.) {2,}/gm, "$1$2 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Raw tags that slipped through would show as literal text on the story page.
  return md.replace(/<\/?(span|div|font|center|section|article|header|footer|small|sup|sub|u|ins|mark)[^>]*>/gi, "");
}

const IMAGE_MD = /!\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)/g;

/** Images in a Markdown body, in order. */
export function markdownImages(md: string) {
  return Array.from(md.matchAll(IMAGE_MD), (m) => ({ alt: m[1].replace(/\\([[\]])/g, "$1"), src: m[2] }));
}

/** Takes out the picture at `src` when it is also the story's lead image, so it isn't shown twice. */
export function withoutImage(md: string, src: string) {
  return md
    .replace(IMAGE_MD, (m, _alt, url) => (url === src ? "" : m))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
