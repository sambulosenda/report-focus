/** Topic tags are stored as typed by the newsroom ("cyril ramaphosa", "SAPS"); these turn them into addresses and names. */

/** Short names that are always written in capitals. */
const ACRONYMS = new Set([
  "anc", "au", "ccc", "da", "dirco", "drc", "eff", "ecowas", "fifa", "idac", "iec", "imf", "mdc", "mk", "nato", "npa", "saps", "sadc",
  "sabc", "uk", "un", "us", "usa", "who", "zanu-pf", "zec", "zrp", "zimra",
]);

/** A tag's address part: lowercase, words joined by hyphens, e.g. "cyril-ramaphosa". */
export function tagSlug(tag: string) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Link to a tag's page. */
export function tagHref(tag: string) {
  return `/tag/${encodeURIComponent(tagSlug(tag))}`;
}

/** A tag as a heading: "cyril ramaphosa" is "Cyril Ramaphosa", "saps" is "SAPS". */
export function tagName(tag: string) {
  return tag
    .trim()
    .split(/\s+/)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
