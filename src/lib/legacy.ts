/**
 * Old WordPress addresses are stored in one shape so a visit matches however it was typed:
 * lowercase, decoded, no trailing slash, and "?p=123" kept as the only query.
 */
export function legacyPathKey(pathname: string, postId?: string | null) {
  let p = pathname;
  try {
    p = decodeURIComponent(p);
  } catch {}
  p = p.toLowerCase().replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  if (!p.startsWith("/")) p = `/${p}`;
  if (postId && /^\d+$/.test(postId)) return `${p === "/" ? "" : p}/?p=${postId}`;
  return p;
}
