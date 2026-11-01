/** A stable URL keeps uploads working across deployments, unlike a build-specific action ID. */
export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const response = await fetch("/api/newsroom/upload", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
      signal: AbortSignal.timeout(90_000),
    });
    if (response.status === 401) return { error: "Your session expired. Sign in again in another tab, then retry this upload." };
    if (response.status === 413) return { error: "Images must be 8 MB or smaller." };
    const result = await response.json().catch(() => null);
    if (!response.ok) return { error: result?.error || "The upload didn’t finish. Try again." };
    if (typeof result?.url !== "string") return { error: "The upload didn’t finish. Try again." };
    return { url: result.url };
  } catch (error) {
    return { error: error instanceof Error && /TimeoutError|AbortError/.test(error.name)
      ? "The upload timed out. Check the media library before retrying."
      : "The upload didn’t finish. Check your connection and try again." };
  }
}
