const INTERVAL_MS = 5 * 60_000;
const mb = (bytes: number) => Math.round(bytes / 1048576);

// rss growing while heap stays flat points at native memory (sharp, libsql) rather than JavaScript objects.
async function logMemory() {
  const m = process.memoryUsage();
  const line: Record<string, number> = {
    uptimeMin: Math.round(process.uptime() / 60),
    rss: mb(m.rss),
    heapUsed: mb(m.heapUsed),
    heapTotal: mb(m.heapTotal),
    external: mb(m.external),
    arrayBuffers: mb(m.arrayBuffers),
  };
  try {
    const sharp = (await import("sharp")).default;
    const cache = sharp.cache();
    const counters = sharp.counters();
    Object.assign(line, { sharpCacheMb: cache.memory.current, sharpCacheItems: cache.items.current, sharpQueue: counters.queue, sharpProcess: counters.process });
  } catch { /* sharp unavailable */ }
  console.log(`[memory] ${JSON.stringify(line)}`);
}

export function startMemoryLog() {
  void logMemory();
  setInterval(logMemory, INTERVAL_MS).unref();
}
