import { getCurrentUser, hasRole } from "@/lib/auth";
import { saveArticle } from "@/actions/articles";
import { readUploadBody } from "@/lib/upload-request";

export const runtime = "nodejs";
const reply = (body: object, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(process.env.SITE_URL || request.url).origin) {
    return reply({ error: "The save request came from another site. Open the newsroom directly and try again." }, 403);
  }
  try {
    const user = await getCurrentUser();
    if (!user) return reply({ error: "Your session expired. Sign in again in another tab, then retry. Keep this editor open." }, 401);
    if (!hasRole(user, "journalist")) return reply({ error: "You cannot edit articles." }, 403);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) return reply({ error: "The article could not be read. Please try again." }, 400);
    const body = await readUploadBody(request, 2 * 1024 * 1024);
    if (!body) return reply({ error: "The article is too large to save. Shorten it and try again." }, 413);
    let form: FormData;
    try {
      form = await new Response(Buffer.from(body), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    } catch {
      return reply({ error: "The article could not be read. Please try again." }, 400);
    }
    const result = await saveArticle(undefined, form, true);
    return reply(result ?? { error: "No save confirmation was received." }, result?.ok ? 200 : 400);
  } catch {
    // A transport error can happen after a database write; do not retry automatically.
    return reply({ error: "We couldn’t confirm the save. Keep this editor open and check the article list in another tab before retrying." }, 503);
  }
}
