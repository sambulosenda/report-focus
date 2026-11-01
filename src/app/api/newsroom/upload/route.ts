import { getCurrentUser, hasRole } from "@/lib/auth";
import { uploadImage } from "@/actions/articles";
import { readUploadBody } from "@/lib/upload-request";

export const runtime = "nodejs";

function reply(body: object, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  // Cookie authentication needs an explicit origin check outside Server Actions.
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.SITE_URL || request.url).origin;
  if (origin !== expected) return reply({ error: "Refresh the newsroom page and try again." }, 403);
  try {
    const user = await getCurrentUser();
    if (!user) return reply({ error: "Sign in again to upload images." }, 401);
    if (!hasRole(user, "journalist")) return reply({ error: "You cannot upload images." }, 403);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) {
      return reply({ error: "Choose an image to upload." }, 400);
    }
    const body = await readUploadBody(request);
    if (!body) return reply({ error: "Images must be 8 MB or smaller." }, 413);
    let form: FormData;
    try {
      form = await new Response(Buffer.from(body), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    } catch {
      return reply({ error: "The image could not be read. Choose it again and retry." }, 400);
    }
    const result = await uploadImage(form);
    return reply(result, result.error ? 400 : 201);
  } catch {
    return reply({ error: "The upload service is unavailable. Please try again shortly." }, 503);
  }
}
