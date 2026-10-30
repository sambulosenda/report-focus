/**
 * Reserved 300 × 250 space for an ad. Hidden unless NEXT_PUBLIC_AD_SLOTS=on,
 * so readers never see an empty box before an ad partner is set up.
 */
export function AdSlot() {
  if (process.env.NEXT_PUBLIC_AD_SLOTS !== "on") return null;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Advertisement</span>
      <div data-ad-slot="300x250" className="flex h-[250px] w-[300px] items-center justify-center border border-dashed border-line-2 bg-mist text-[13px] text-muted">
        Ad slot 300 × 250
      </div>
    </div>
  );
}
