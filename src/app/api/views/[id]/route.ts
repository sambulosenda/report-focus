import { countView } from "@/lib/views";

/** A story view, sent by ViewBeacon. Views are added up in memory and written in batches. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (Number.isInteger(id) && id > 0) countView(id);
  return new Response(null, { status: 204 });
}
