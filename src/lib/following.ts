import { tagSlug } from "./tags";

/** Stable list identifiers; encoded tags also support punctuation and non-English names. */
export const storyFollowList = (id: number) => `story-${id}`;
export const topicFollowList = (tag: string) => `topic-${encodeURIComponent(tagSlug(tag))}`;
export const isFollowList = (list: string) => list.startsWith("story-") || list.startsWith("topic-");

export function followTarget(list: string): { storyId: number } | { topic: string } | null {
  if (/^story-[1-9]\d*$/.test(list)) {
    const storyId = Number(list.slice(6));
    return Number.isSafeInteger(storyId) ? { storyId } : null;
  }
  if (list.startsWith("topic-")) {
    try {
      const topic = decodeURIComponent(list.slice(6));
      if (topic && topic !== "sample" && topicFollowList(topic) === list) return { topic };
    } catch { /* Malformed addresses cannot become subscriptions. */ }
  }
  return null;
}
