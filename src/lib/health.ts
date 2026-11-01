/** Bound a health probe so an unavailable database yields 503 before the external monitor times out. */
export async function checkHealth(probe: () => Promise<unknown>, timeoutMs = 3000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(probe),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Health probe timed out")), timeoutMs); }),
    ]);
    return true;
  } catch { return false; }
  finally { if (timer) clearTimeout(timer); }
}
