/**
 * A story's tags split the way storiesByTag matches them in SQL: lowercased, ", " treated as ",".
 * Keep the two in step, or the tag page would turn away tags the query can find.
 */
export function tagTokens(tags: string) {
  return new Set(tags.toLowerCase().replaceAll(", ", ",").split(",").filter(Boolean));
}

/** The needle storiesByTag searches for, without LIKE wildcards. */
export const tagNeedle = (tag: string) => tag.trim().toLowerCase().replace(/[%_]/g, "");
