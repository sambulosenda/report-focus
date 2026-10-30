import { Marked, type Tokens } from "marked";

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
      return `<figure><img src="${escapeHtml(safeUrl(href))}" alt="${escapeHtml(text)}" loading="lazy" />${
        caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""
      }</figure>`;
    },
  },
});

export function renderMarkdown(source: string) {
  return marked.parse(source, { async: false }) as string;
}

/**
 * A story body with `insert` placed between paragraphs: after the third paragraph, then every
 * sixth, at most three times, and never with fewer than two paragraphs left below it.
 */
export function renderMarkdownWithBreaks(source: string, insert: string) {
  if (!insert) return renderMarkdown(source);
  const tokens = marked.lexer(source);
  const total = tokens.filter((t) => t.type === "paragraph").length;
  let html = "";
  let seen = 0;
  let placed = 0;
  let start = 0;
  tokens.forEach((t, i) => {
    if (t.type !== "paragraph") return;
    seen++;
    if (placed < 3 && seen >= 3 && (seen - 3) % 6 === 0 && total - seen >= 2) {
      html += marked.parser(Object.assign(tokens.slice(start, i + 1), { links: tokens.links })) + insert;
      start = i + 1;
      placed++;
    }
  });
  return html + marked.parser(Object.assign(tokens.slice(start), { links: tokens.links }));
}
