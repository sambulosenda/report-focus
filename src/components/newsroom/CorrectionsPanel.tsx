import { addCorrection } from "@/actions/corrections";
import { CorrectionHistory } from "../CorrectionHistory";
import { ActionForm } from "./ActionForm";
import { ConfirmButton } from "./ConfirmButton";
import { btnBrand, inputClass } from "./ui";
export function CorrectionsPanel({ articleId, live }: { articleId: number; live: boolean }) {
  return (
    <section aria-labelledby="corrections-panel" className="mx-auto max-w-[1360px] px-4 pb-10 md:px-6">
      <div className="rounded-xl border border-line bg-white p-5 md:p-8">
        <h2 id="corrections-panel" className="text-base font-extrabold">Publish a correction</h2>
        <p className="mt-2 text-sm text-muted">Save any changes to the story first, then explain what changed and why. Correction notes appear publicly and stay in the history. Add a new note to clarify an earlier one.</p>
        {live ? (
          <ActionForm action={addCorrection} resetOnSuccess className="mt-4 grid gap-3">
            <input type="hidden" name="articleId" value={articleId} />
            <label className="flex flex-col gap-2 text-sm font-bold">Correction note
              <textarea name="body" required minLength={10} maxLength={2000} rows={4} className={`${inputClass} font-normal`} placeholder="An earlier version stated… The correct information is…" />
            </label>
            <div><ConfirmButton className={btnBrand} message="Publish this correction for readers? It will remain in the story’s correction history.">Publish correction</ConfirmButton></div>
          </ActionForm>
        ) : <p className="mt-4 text-sm text-muted">Publish the story before adding a correction.</p>}
        <CorrectionHistory articleId={articleId} />
      </div>
    </section>
  );
}
