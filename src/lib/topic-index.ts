import { tagSlug, TAG_INDEX_MIN } from "./tags";
import { isWireByline } from "./seo";

/** Count each published, non-wire story once per normalised topic. */
export function topicIndex(stories: { tags: string; updatedAt: Date; author: { name: string } }[]) {
  const topics = new Map<string, { n: number; at: Date }>();
  for (const story of stories) {
    if (isWireByline(story.author.name)) continue;
    for (const slug of new Set(story.tags.split(",").map(tagSlug))) {
      if (!slug || slug === "sample") continue;
      const prev = topics.get(slug);
      topics.set(slug, { n: (prev?.n ?? 0) + 1, at: prev && prev.at > story.updatedAt ? prev.at : story.updatedAt });
    }
  }
  return new Map([...topics].filter(([, topic]) => topic.n >= TAG_INDEX_MIN));
}
