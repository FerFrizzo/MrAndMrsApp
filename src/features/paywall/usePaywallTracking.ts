import { useEffect } from "react";
import { track, type PaywallSource } from "../../lib/analytics";
import { classifyPurchaseError } from "./purchaseError";

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
    // Returns true when the user cancelled, so the caller can skip its error UI.
    onPurchaseFailed: (error: unknown): boolean => {
      const kind = classifyPurchaseError(error);
      if (kind === "cancelled") {
        track("purchase_cancelled", { source });
        return true;
      }
      track("purchase_failed", { source, reason: kind });
      return false;
    },
    onPremiumGranted: () => track("premium_granted", { source }),
    onPremiumGrantFailed: () => track("premium_grant_failed", { source }),
    onDismissed: () => track("paywall_dismissed", { source }),
  };
}
