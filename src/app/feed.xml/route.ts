import { latestStories } from "@/lib/queries";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function GET() {
  const stories = await latestStories(50);
  const items = stories
    .map((s) => {
      const link = siteUrl(`/${s.category?.slug ?? "news"}/${s.slug}`);
      return `<item><title>${esc(s.title)}</title><link>${link}</link><guid>${link}</guid><description>${esc(s.summary)}</description>${
        s.category ? `<category>${esc(s.category.name)}</category>` : ""
      }<pubDate>${s.publishedAt?.toUTCString()}</pubDate></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Report Focus</title><link>${siteUrl()}</link><description>Latest news from Report Focus</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
