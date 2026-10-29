import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { articles, categories, media, users } from "@/db/schema";
import { ArticleEditor } from "@/components/newsroom/ArticleEditor";
import { PageHeader, btnGhost } from "@/components/newsroom/ui";
import { requireUser } from "@/lib/auth";
import { canEditArticle } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit story" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const row = await db
    .select({ article: articles, author: users.name, categorySlug: categories.slug })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId))
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .where(eq(articles.id, id))
    .get();
  if (!row) notFound();
  const { article } = row;

  if (!canEditArticle(user, article)) {
    return (
      <>
        <PageHeader title={article.title} />
        <div className="p-6">
          <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This story has been published, so only editors can change it. Ask an editor if it needs a correction.
          </p>
          <Link href="/newsroom/articles" className={`${btnGhost} mt-4 inline-block`}>Back to stories</Link>
        </div>
      </>
    );
  }

  const [cats, library] = await Promise.all([
    db.select().from(categories).orderBy(categories.sortOrder),
    db.select({ id: media.id, url: media.url, alt: media.alt }).from(media).orderBy(desc(media.createdAt)).limit(60),
  ]);
  const live = article.status === "published" && article.publishedAt && article.publishedAt <= new Date();

  return (
    <>
      <PageHeader
        title="Edit story"
        description={`By ${row.author} · created ${formatDateTime(article.createdAt)}${article.publishedAt ? ` · published ${formatDateTime(article.publishedAt)}` : ""}`}
      >
        <Link href="/newsroom/articles" className={btnGhost}>All stories</Link>
      </PageHeader>
      <ArticleEditor
        article={article}
        categories={cats}
        library={library}
        role={user.role}
        publicUrl={live ? `/${row.categorySlug ?? "news"}/${article.slug}` : undefined}
      />
    </>
  );
}
