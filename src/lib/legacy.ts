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
  // WordPress reads ?p= as a number, so ?p=0123 is post 123.
  if (postId && /^\d+$/.test(postId)) return `${p === "/" ? "" : p}/?p=${Number(postId)}`;
  return p;
}
