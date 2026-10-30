import { adsenseClient } from "@/lib/ads";

export const dynamic = "force-dynamic";

/** Tells ad buyers which AdSense account may sell space on this site. Google checks it before serving ads. */
export function GET() {
  const client = adsenseClient();
  if (!client) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
