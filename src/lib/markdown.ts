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
