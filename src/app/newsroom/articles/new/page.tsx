import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { categories, media } from "@/db/schema";
import { ArticleEditor } from "@/components/newsroom/ArticleEditor";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "New story" };

export default async function NewArticlePage() {
  const user = await requireUser();
  const [cats, library] = await Promise.all([
    db.select().from(categories).orderBy(categories.sortOrder),
    db.select({ id: media.id, url: media.url, alt: media.alt }).from(media).orderBy(desc(media.createdAt)).limit(60),
  ]);
  return <ArticleEditor categories={cats} library={library} role={user.role} authorName={user.name} />;
}
