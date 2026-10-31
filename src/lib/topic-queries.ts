import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, users } from "@/db/schema";
import { isLive } from "./queries";
import { topicIndex } from "./topic-index";

export const indexedTopics = unstable_cache(async () => {
  const stories = await db.select({ tags: articles.tags, updatedAt: articles.updatedAt, author: { name: users.name } })
    .from(articles).innerJoin(users, eq(users.id, articles.authorId)).where(isLive());
  return [...topicIndex(stories)];
}, ["indexed-topics"], { revalidate: 60 });
