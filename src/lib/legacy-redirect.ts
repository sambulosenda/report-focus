import "server-only";
import { notFound, permanentRedirect } from "next/navigation";
import { legacyPathKey } from "./legacy";
import { legacyTarget } from "./queries";

/** Sends an old WordPress address (an already-decoded path from page params) to its new home, or shows the 404 page. */
export async function redirectLegacyOrNotFound(pathname: string, postId?: string | null): Promise<never> {
  const target = await legacyTarget(legacyPathKey(pathname, postId, { decoded: true }));
  if (target) permanentRedirect(target);
  notFound();
}
