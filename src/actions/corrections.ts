"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { recordCorrection } from "@/lib/corrections";
import type { FormState } from "./auth";
export async function addCorrection(_previous: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("editor");
  const result = await recordCorrection(user, { articleId: formData.get("articleId"), body: formData.get("body") });
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
