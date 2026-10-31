"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markWhatsAppPost } from "@/lib/whatsapp";
import type { FormState } from "./auth";

async function mark(kind: "briefing" | "breaking", formData: FormData): Promise<FormState> {
  const user = await requireUser("editor");
  const res = await markWhatsAppPost({ kind, body: String(formData.get("body") ?? ""), postedBy: user.id });
  revalidatePath("/newsroom/whatsapp");
  revalidatePath("/newsroom");
  return res.ok ? { ok: "Marked as posted." } : { error: res.error };
}

export async function markBriefingPosted(_prev: FormState, formData: FormData): Promise<FormState> {
  return mark("briefing", formData);
}

export async function markBreakingPosted(_prev: FormState, formData: FormData): Promise<FormState> {
  return mark("breaking", formData);
}
