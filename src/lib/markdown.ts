import { Marked, type Tokens } from "marked";
import { canOptimize } from "@/lib/images";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function safeUrl(href: string) {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return trimmed;
  return "#";
}

const marked: Marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    // Raw HTML typed into an article is shown as text, never executed.
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:/i.test(href);
      return `<a href="${escapeHtml(safeUrl(href))}"${title ? ` title="${escapeHtml(title)}"` : ""}${
        external ? ' target="_blank" rel="noopener noreferrer"' : ""
      }>${text}</a>`;
    },
    // "> **What to know**" as the first line turns a quote into the grey key-points box.
    // A quote whose last line starts with an em dash gets that line as its attribution.
    blockquote({ tokens, text }: Tokens.Blockquote): string {
      const [first] = tokens;
      const label = /^\*\*what to know\*\*[ \t]*(?:\n|$)/i;
      if (first?.type === "paragraph" && label.test((first as Tokens.Paragraph).text.trim())) {
        // Points typed straight under the label, with no blank line, are parsed again on their own.
        const rest = text.trim().replace(label, "");
        return `<aside class="what-to-know"><p class="what-to-know-label">What to know</p>${marked.parse(rest, { async: false })}</aside>`;
      }
      const lines = text.trim().split("\n");
      const cite = lines[lines.length - 1].match(/^(?:—|--)\s*(.+)$/);
      if (lines.length > 1 && cite) {
        const quote = lines.slice(0, -1).join("\n");
        return `<blockquote>${marked.parse(quote, { async: false })}<footer>— ${marked.parseInline(cite[1], { async: false })}</footer></blockquote>`;
      }
      return `<blockquote>${this.parser.parse(tokens)}</blockquote>`;
    },
    image({ href, title, text }: Tokens.Image) {
      const caption = title || "";
      return `<figure><img ${imageSrc(safeUrl(href))} alt="${escapeHtml(text)}" loading="lazy" decoding="async" />${
        caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""
      }</figure>`;
    },
  },
});

// Pictures in the story body are at most 680px wide, so phones get a 640px copy and big screens a 1080px one.
const BODY_WIDTHS = [640, 828, 1080];

/** src and srcset for a body picture, sent through the Next.js image resizer when it can take it. */
function imageSrc(url: string) {
  if (!canOptimize(url)) return `src="${escapeHtml(url)}"`;
  const resized = (w: number) => `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
  const srcset = BODY_WIDTHS.map((w) => `${resized(w)} ${w}w`).join(", ");
  return `src="${escapeHtml(resized(1080))}" srcset="${escapeHtml(srcset)}" sizes="(min-width: 680px) 680px, 100vw"`;
}

export function renderMarkdown(source: string) {
  return marked.parse(source, { async: false }) as string;
}
