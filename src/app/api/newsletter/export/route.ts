import { asc } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSignups } from "@/db/schema";
import { getCurrentUser, hasRole } from "@/lib/auth";

const iso = (d: Date | null) => (d ? d.toISOString() : "");
// Quote every cell and defuse leading = + - @ so a spreadsheet never runs an email address as a formula.
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

/** Admins download every sign-up, for moving to another email service or for a reader's data request. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, "admin")) return new Response("Forbidden", { status: 403 });
  const rows = await db.select().from(newsletterSignups).orderBy(asc(newsletterSignups.list), asc(newsletterSignups.email));
  const lines = [
    "email,newsletter,status,signed_up,confirmed,unsubscribed",
    ...rows.map((r) =>
      [r.email, r.list, r.unsubscribedAt ? "unsubscribed" : r.confirmedAt ? "confirmed" : "not confirmed", iso(r.createdAt), iso(r.confirmedAt), iso(r.unsubscribedAt)].map(cell).join(","),
    ),
  ];
  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="newsletter-readers.csv"` },
  });
}
