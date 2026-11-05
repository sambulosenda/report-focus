/**
 * Keeps a function's result in memory for `ttlMs`, so a hot read runs at most once per window on this machine.
 * Unlike unstable_cache, values are kept as they are (Dates stay Dates). A failed call is not kept.
 */
export function memo<T>(ttlMs: number, fn: () => Promise<T>, now: () => number = Date.now) {
  let entry: { at: number; value: Promise<T> } | null = null;
  return (): Promise<T> => {
    if (entry && now() - entry.at < ttlMs) return entry.value;
    const value = fn();
    const mine = { at: now(), value };
    entry = mine;
    value.catch(() => { if (entry === mine) entry = null; });
    return value;
  };
}
