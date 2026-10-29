import type { Article, User } from "@/db/schema";
import { hasRole } from "./auth-shared";

/** Journalists can edit their own stories until an editor publishes them. Editors and admins can edit anything. */
export function canEditArticle(user: User, article: Pick<Article, "authorId" | "status">) {
  if (hasRole(user, "editor")) return true;
  return article.authorId === user.id && (article.status === "draft" || article.status === "review");
}

export function canPublish(user: User) {
  return hasRole(user, "editor");
}

export function canDeleteArticle(user: User, article: Pick<Article, "authorId" | "status">) {
  if (hasRole(user, "editor")) return true;
  return article.authorId === user.id && article.status === "draft";
}
