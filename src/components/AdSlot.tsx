import { adConfig, type AdPlacement } from "@/lib/ads";
import { cn } from "@/lib/utils";

/**
 * One ad space. Renders nothing until AdSense is configured for this placement
 * (see src/lib/ads.ts), and hides itself if Google has no ad to fill it with.
 */
export function AdSlot({ placement = "sidebar", className }: { placement?: AdPlacement; className?: string }) {
  const ad = adConfig(placement);
  if (!ad) return null;
  return (
    <aside aria-label="Advertisement" className={cn("ad-slot", `ad-${placement}`, className)}>
      <span className="ad-label">Advertisement</span>
      {ad.mode === "live" ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ad.client}
          data-ad-slot={ad.slot}
          data-ad-format={placement === "sidebar" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-placeholder">Ad slot</div>
      )}
    </aside>
  );
}
