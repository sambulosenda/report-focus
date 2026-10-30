/**
 * Lists stories that may be filed in the wrong section, for an editor to check. Changes nothing.
 *
 *   npm run sections:review                       → reports/section-review.csv
 *   npm run sections:review -- --sections=south-africa,sports
 *
 * Many stories brought over from WordPress landed in South Africa, Entertainment or Sports because of how they were
 * filed there. For each story in those sections, this suggests a better section from its tags and headline, and
 * leaves it out when it already looks right. Move a story by editing it in the newsroom: its old address
 * redirects to the new one.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Words in a story's tags or headline, and the section they point to. The first match wins.
const RULES: [RegExp, string][] = [
  [/\b(zimbabwe|harare|bulawayo|mnangagwa|zanu-?pf|chamisa|zrp|zimra|zec|mutare|gweru|masvingo)\b/i, "zimbabwe"],
  [/\b(ukraine|russia|putin|kremlin|gaza|israel|iran|china|beijing|europe|uk|britain|london|india|pakistan|nato|un|united nations|middle east|qatar)\b/i, "world"],
  [/\b(trump|biden|white house|washington|congress|u\.?s\.?|united states|america|american)\b/i, "us"],
  [/\b(kenya|nigeria|ghana|uganda|tanzania|zambia|malawi|mozambique|botswana|namibia|eswatini|lesotho|congo|drc|rwanda|ethiopia|sudan|egypt|sadc|au|african union)\b/i, "africa"],
  [/\b(ebola|cholera|mpox|covid|hospital|health|disease|outbreak|vaccine)\b/i, "health"],
  [/\b(climate|drought|flood|cyclone|weather|environment)\b/i, "climate"],
  [/\b(football|soccer|cricket|rugby|fifa|premier league|afcon|bafana|warriors|olympics?|tennis|athletics)\b/i, "sports"],
  [/\b(music|film|movie|celebrity|actor|actress|singer|album|award|entertainment)\b/i, "entertainment"],
  [/\b(economy|business|rand|inflation|bank|market|fuel|mining|investment|budget|tax)\b/i, "business"],
  [/\b(ramaphosa|anc|eff|mk party|saps|npa|idac|dirco|johannesburg|cape town|durban|pretoria|gauteng|madlanga|mkhwanazi|zuma)\b/i, "south-africa"],
];

// A cell starting with = + - @ would run as a formula in a spreadsheet, so it gets a leading tab.
const csv = (v: unknown) => `"${String(v ?? "").replace(/^[=+\-@\t\r]/, "\t$&").replace(/"/g, '""')}"`;

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--sections="));
  const check = (arg ? arg.slice("--sections=".length) : "south-africa,entertainment,sports").split(",").map((s) => s.trim());
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: process.env.DATABASE_URL ?? "file:./data/report-focus.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined });

  const sections = new Set((await db.execute("select slug from categories")).rows.map((r) => String(r.slug)));
  const { rows } = await db.execute({
    sql: `select a.id, a.slug, a.title, a.tags, c.slug as section from articles a join categories c on c.id = a.category_id
          where a.status = 'published' and c.slug in (${check.map(() => "?").join(",")}) order by a.published_at desc`,
    args: check,
  });

  const lines = [["id", "current_section", "suggested_section", "matched", "title", "tags", "url"].join(",")];
  let flagged = 0;
  for (const r of rows) {
    const text = `${r.tags} ${r.title}`;
    // A story that mentions its own section's places or people is left alone.
    if (RULES.some(([re, to]) => to === r.section && re.test(text))) continue;
    const rule = RULES.find(([re, to]) => sections.has(to) && re.test(text));
    if (!rule || rule[1] === r.section) continue;
    flagged++;
    const matched = text.match(rule[0])?.[0];
    lines.push([r.id, r.section, rule[1], matched, r.title, r.tags, `/${r.section}/${r.slug}`].map(csv).join(","));
  }

  const out = path.join("reports", "section-review.csv");
  await mkdir("reports", { recursive: true });
  await writeFile(out, `${lines.join("\n")}\n`);
  console.log(`Checked ${rows.length} stories in ${check.join(", ")}. ${flagged} may belong elsewhere: see ${out}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
