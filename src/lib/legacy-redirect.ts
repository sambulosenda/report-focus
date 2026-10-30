import "server-only";
import { notFound, permanentRedirect } from "next/navigation";
import { legacyPathKey } from "./legacy";
import { legacyTarget } from "./queries";

/** Where an old WordPress address (an already-decoded path) lives now, or null when it has no new home. */
export async function legacyDestination(pathname: string, postId?: string | null) {
  const target = await legacyTarget(legacyPathKey(pathname, postId, { decoded: true }));
  if (target) return target;
  // A picture page (/2025/04/17/story/img_0771/) or AMP copy (/2025/04/17/story/amp/) belongs to its story.
  const story = /^(\/\d{4}\/\d{2}\/\d{2}\/[^/]+)\/[^/]+\/?$/.exec(pathname)?.[1];
  return story && !postId ? legacyTarget(legacyPathKey(story, null, { decoded: true })) : null;
}

/** Sends an old WordPress address (an already-decoded path from page params) to its new home, or shows the 404 page. */
export async function redirectLegacyOrNotFound(pathname: string, postId?: string | null): Promise<never> {
  const target = await legacyDestination(pathname, postId);
  if (target) permanentRedirect(target);
  notFound();
}
