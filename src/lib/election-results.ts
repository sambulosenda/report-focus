import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { electionResults, electionResultHistory, type User } from "@/db/schema";
import { canPublish } from "./permissions";
import { electionResultInput, ELECTION_START, type PublicElectionResult } from "./elections";

export async function publicElectionResults(now = new Date()): Promise<PublicElectionResult[]> {
  if (now < ELECTION_START) return [];
  const rows = await db.select().from(electionResults).where(eq(electionResults.published, true)).orderBy(desc(electionResults.updatedAt));
  return rows.map((r) => ({ id: r.id, data: r.data, updatedAt: r.updatedAt.toISOString() }));
}

export async function storeElectionResult(user: User, input: { id?: number; revision: number; data: unknown; published: boolean; verified: boolean }, now = new Date()): Promise<{ ok?: string; error?: string }> {
  if (!canPublish(user)) return { error: "Only editors can manage election results." };
  if (!Number.isSafeInteger(input.revision) || input.revision < 0 || (input.id !== undefined && (!Number.isSafeInteger(input.id) || input.id < 1))) return { error: "Invalid result version. Reload the page." };
  const parsed = electionResultInput.safeParse(input.data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  if (new Date(data.sourceAsOf) > now) return { error: "The source timestamp cannot be in the future." };
  if (input.published && (!input.verified || now < ELECTION_START || new Date(data.sourceAsOf) < ELECTION_START)) return { error: "Publish only verified 2026 results dated on or after election day (4 November)." };
  try {
    return await db.transaction(async (tx) => {
      const existing = input.id ? await tx.select().from(electionResults).where(eq(electionResults.id, input.id)).get() : undefined;
      if (input.id && (!existing || existing.revision !== input.revision)) return { error: "Another editor changed this result. Reload before saving." };
      if (existing && existing.municipalityCode !== data.municipalityCode) return { error: "The municipality code cannot be changed on an existing result." };
      const revision = (existing?.revision ?? 0) + 1;
      const values = { data, published: input.published, revision, updatedBy: user.id, updatedAt: now };
      const [saved] = existing
        ? await tx.update(electionResults).set(values).where(and(eq(electionResults.id, existing.id), eq(electionResults.revision, input.revision))).returning()
        : await tx.insert(electionResults).values({ ...values, municipalityCode: data.municipalityCode }).returning();
      if (!saved) return { error: "Another editor changed this result. Reload before saving." };
      await tx.insert(electionResultHistory).values({ resultId: saved.id, data, published: input.published, revision, editorId: user.id, createdAt: now });
      return { ok: input.published ? "Verified result published." : "Draft saved. This result is hidden from readers." };
    });
  } catch (error) {
    if (String(error).includes("UNIQUE") || String((error as { cause?: unknown }).cause).includes("UNIQUE")) return { error: "This municipality already has a result. Open it from the list to update it." };
    throw error;
  }
}
