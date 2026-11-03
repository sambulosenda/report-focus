/**
 * libsql's HTTP client sends at most 20 requests at once and never times one out. A connection that dies without
 * closing holds its slot forever, and once all 20 are held every query on the site waits behind them.
 */
export function fetchWithTimeout(ms: number) {
  return (request: Request) => fetch(request, { signal: AbortSignal.timeout(ms) });
}
