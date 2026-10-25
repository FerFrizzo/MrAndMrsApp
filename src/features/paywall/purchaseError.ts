import type { PurchaseErrorKind } from "../../lib/analytics";

type PurchaseLikeError = { code?: string | number; userCancelled?: boolean | null; message?: string };

// RevenueCat PURCHASES_ERROR_CODE values (purchases-typescript-internal).
const BY_CODE: Record<string, PurchaseErrorKind | "cancelled"> = {
  "1": "cancelled",
  "2": "store_problem",
  "3": "not_allowed",
  "5": "product_unavailable",
  "10": "network",
  "20": "payment_pending",
};

// Only the classified kind may be tracked, never the store's message.
export function classifyPurchaseError(error: unknown): PurchaseErrorKind | "cancelled" {
  const e = (error ?? {}) as PurchaseLikeError;
  if (e.userCancelled) return "cancelled";
  const byCode = e.code != null ? BY_CODE[String(e.code)] : undefined;
  if (byCode) return byCode;
  // paymentService throws this itself when the store returns no product.
  if (typeof e.message === "string" && /product not available/i.test(e.message)) {
    return "product_unavailable";
  }
  return "unknown";
}
