import { llmsTxt } from "@/lib/llms";

// Read from the database when asked, not when the site is built; Cloudflare may keep a copy for an hour.
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(await llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
