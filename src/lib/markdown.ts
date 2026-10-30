import { Marked, type Tokens } from "marked";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function safeUrl(href: string) {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return trimmed;
  return "#";
}

const marked = new Marked({
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
    // "> **What to know**" on its own line turns a quote into the grey key-points box.
    // A quote whose last line starts with an em dash gets that line as its attribution.
    blockquote({ tokens }: Tokens.Blockquote) {
      const [first] = tokens;
      if (first?.type === "paragraph" && /^\*\*what to know\*\*$/i.test((first as Tokens.Paragraph).text.trim())) {
        return `<aside class="what-to-know"><p class="what-to-know-label">What to know</p>${this.parser.parse(tokens.slice(1))}</aside>`;
      }
      const last = tokens[tokens.length - 1];
      if (tokens.length > 1 && last?.type === "paragraph" && /^(—|--)\s*/.test((last as Tokens.Paragraph).text)) {
        const cite = this.parser.parseInline((last as Tokens.Paragraph).tokens).replace(/^(—|--)\s*/, "");
        return `<blockquote>${this.parser.parse(tokens.slice(0, -1))}<footer>— ${cite}</footer></blockquote>`;
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
