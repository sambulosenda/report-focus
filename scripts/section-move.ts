/**
 * Applies the section moves from reports/section-review.csv.
 * Skips a hardcoded list of known misfires (see below).
 * Dry-run by default; pass --apply to commit changes.
 *
 *   npm run sections:review          # regenerate CSV first
 *   npx tsx --env-file-if-exists=.env scripts/section-move.ts
 *   npx tsx --env-file-if-exists=.env scripts/section-move.ts --apply
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

// Stories the review script flagged but that are correctly filed on editorial judgement.
const SKIP = new Set([
  795,  // "Bafana coach secures US visas" -- sport/SA story, not US politics
  748,  // "Tyla at FIFA ceremony" -- entertainment/sport, not US
  1809, // "DA MP disputes disqualification ahead of congress" -- SA parliament, not US Congress
  279,  // "Senzo Meyiwa trial" -- crime/SA, matched "football" but it's a murder trial
  766,  // "Fadiel Adams bail" -- SA crime, matched "Congress" as SA parliament word
  743,  // "NCC leader Fadiel Adams" -- SA crime, same
  277,  // "Coalition tensions / VAT hike" -- SA politics, matched "Congress"
  1532, // "Charred bodies in Alberton apartment" -- crime, not business
  485,  // "Khanyi Mbau's ex-husband dies in New York" -- entertainment, not business
  366,  // "Industry Icons Honor Nandi Nyembe" -- entertainment, not business
  1793, // "Lebo M files lawsuit over Nants' Ingonyama joke" -- entertainment, not zimbabwe
]);

async function main() {
  const apply = process.argv.includes("--apply");
  const csv = await readFile(path.join("reports", "section-review.csv"), "utf8");
  const lines = csv.trim().split("\n").slice(1); // skip header

  // Parse: id, current_section, suggested_section (first 3 quoted fields)
  const moves: { id: number; from: string; to: string; title: string }[] = [];
  for (const line of lines) {
    const parts = line.match(/"([^"]*)"/g)?.map((s) => s.slice(1, -1));
    if (!parts || parts.length < 5) continue;
    const id = Number(parts[0]);
    if (!id || SKIP.has(id)) continue;
    moves.push({ id, from: parts[1], to: parts[2], title: parts[4] });
  }

  console.log(`${moves.length} moves to apply (${SKIP.size} skipped as misfires).`);

  if (!apply) {
    // Print a preview grouped by destination
    const byDest: Record<string, typeof moves> = {};
    for (const m of moves) (byDest[m.to] ??= []).push(m);
    for (const [dest, list] of Object.entries(byDest).sort()) {
      console.log(`\n→ ${dest} (${list.length})`);
      for (const m of list) console.log(`  [${m.id}] ${m.title}`);
    }
    console.log("\nDry run. Pass --apply to commit these moves.");
    return;
  }

  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/report-focus.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  // Resolve section slugs → category IDs once
  const { rows: cats } = await db.execute("select id, slug from categories");
  const catId = new Map(cats.map((r) => [String(r.slug), Number(r.id)]));

  let moved = 0;
  let failed = 0;
  for (const m of moves) {
    const newCatId = catId.get(m.to);
    if (!newCatId) {
      console.warn(`  SKIP [${m.id}] -- section "${m.to}" not found in categories`);
      failed++;
      continue;
    }
    await db.execute({ sql: "update articles set category_id = ? where id = ?", args: [newCatId, m.id] });
    console.log(`  moved [${m.id}] ${m.from} → ${m.to}  ${m.title}`);
    moved++;
  }

  db.close();
  console.log(`\nDone. ${moved} moved, ${failed} skipped (unknown section).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
