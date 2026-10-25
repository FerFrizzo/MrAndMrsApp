import { classifyPurchaseError } from "./purchaseError";

describe("classifyPurchaseError", () => {
  it("treats RevenueCat cancellations as cancelled", () => {
    expect(classifyPurchaseError({ userCancelled: true })).toBe("cancelled");
    expect(classifyPurchaseError({ code: "1" })).toBe("cancelled");
  });

  it("maps RevenueCat error codes to fixed reasons", () => {
    expect(classifyPurchaseError({ code: "2" })).toBe("store_problem");
    expect(classifyPurchaseError({ code: "3" })).toBe("not_allowed");
    expect(classifyPurchaseError({ code: "5" })).toBe("product_unavailable");
    expect(classifyPurchaseError({ code: "10" })).toBe("network");
    expect(classifyPurchaseError({ code: "20" })).toBe("payment_pending");
  });

  it("recognises the app's own product-unavailable error", () => {
    expect(
      classifyPurchaseError(new Error("Product not available. Please try again later.")),
    ).toBe("product_unavailable");
  });

  it("falls back to unknown", () => {
    expect(classifyPurchaseError({ code: "999" })).toBe("unknown");
    expect(classifyPurchaseError(null)).toBe("unknown");
  });
});
