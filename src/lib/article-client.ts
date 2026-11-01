import type { ArticleFormState } from "@/actions/articles";

/** Stable transport for draft, review, publish and unpublish operations across deployments. */
export async function saveArticle(_prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  try {
    const response = await fetch("/api/newsroom/articles", {
      method: "POST", body: formData, credentials: "same-origin", signal: AbortSignal.timeout(45_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) return { error: result?.error || "We couldn’t confirm the save. Keep this editor open and check the article list in another tab before retrying." };
    if (!result?.ok || typeof result.savedAt !== "number") return { error: "No save confirmation was received. Check the article list before retrying." };
    return result;
  } catch {
    return { error: "We couldn’t confirm the save. Keep this editor open and check your connection and article list before retrying." };
  }
}
