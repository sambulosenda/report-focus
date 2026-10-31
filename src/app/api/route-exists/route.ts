import { unstable_cache } from "next/cache";
import { categoryBySlug } from "@/lib/queries";
import { legacyDestination } from "@/lib/legacy-redirect";

const exists = unstable_cache(async (slug: string) =>
  !!(await categoryBySlug(slug)) || !!(await legacyDestination(`/${slug}`)),
["top-level-route-exists"], { revalidate: 60 });

/** Public route existence only: never returns article content, credentials or staff information. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug || slug.length > 200 || slug.includes("/")) return Response.json({ exists: false });
  return Response.json({ exists: await exists(slug) }, { headers: { "Cache-Control": "public, max-age=60" } });
}
