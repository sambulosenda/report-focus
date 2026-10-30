import { storyHref } from "@/components/Story";
import { breakingStory } from "@/lib/queries";

/** The story on the breaking banner, polled by open pages so they can show news as it breaks. */
export async function GET() {
  const s = await breakingStory();
  return Response.json(s ? { id: s.id, title: s.title, href: storyHref(s), publishedAt: s.publishedAt?.toISOString() } : null, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=30" },
  });
}
