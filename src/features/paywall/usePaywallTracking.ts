import { useEffect } from "react";
import { track, type PaywallSource } from "../../lib/analytics";

// `active` is the modal's visible flag. PaywallModal stays mounted, so a
// mount-only effect would miss later opens.
export function usePaywallTracking(source: PaywallSource, active: boolean) {
  useEffect(() => {
    if (!active) return;
    track("paywall_viewed", { source });
  }, [active, source]);

  return {
    onPurchaseCompleted: (productId: string) =>
      track("purchase_completed", { source, product_id: productId }),
    onDismissed: () => track("paywall_dismissed", { source }),
  };
}
