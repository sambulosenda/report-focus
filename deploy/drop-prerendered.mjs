// The image is built against an empty database, so every page the build prepared in advance is blank.
// Deleting those copies before the server starts makes it build each one from the real database on first visit.
import { readFileSync, rmSync } from "node:fs";

const { routes } = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8"));
let dropped = 0;
for (const [route, info] of Object.entries(routes)) {
  if (typeof info.initialRevalidateSeconds !== "number") continue; // never refreshed, so it holds no database content
  const file = `.next/server/app${route === "/" ? "/index" : route}`;
  for (const ext of [".html", ".rsc", ".meta", ".prefetch.rsc"]) rmSync(file + ext, { force: true });
  dropped++;
}
console.log(`Dropped ${dropped} pages built without the database.`);
