import { renderHook } from "@testing-library/react-native";

const mockTrack = jest.fn();
jest.mock("../../lib/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

import { usePaywallTracking } from "./usePaywallTracking";

beforeEach(() => jest.clearAllMocks());

describe("usePaywallTracking", () => {
  it("tracks paywall_viewed when the modal becomes visible", () => {
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => usePaywallTracking("create_game", active),
      { initialProps: { active: false } },
    );
    expect(mockTrack).not.toHaveBeenCalled();
    rerender({ active: true });
    rerender({ active: true });
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith("paywall_viewed", { source: "create_game" });
  });

  it("tracks purchase and dismiss with the source and product id", () => {
    const { result } = renderHook(() => usePaywallTracking("dashboard_pricing", true));
    result.current.onPurchaseCompleted("com.ferfrizzo.MrAndMrsApp.premium_game");
    result.current.onDismissed();
    expect(mockTrack).toHaveBeenCalledWith("purchase_completed", {
      source: "dashboard_pricing",
      product_id: "com.ferfrizzo.MrAndMrsApp.premium_game",
    });
    expect(mockTrack).toHaveBeenCalledWith("paywall_dismissed", { source: "dashboard_pricing" });
    expect(JSON.stringify(mockTrack.mock.calls)).not.toMatch(/price|\$/);
  });

  it("separates a cancelled purchase from a failed one", () => {
    const { result } = renderHook(() => usePaywallTracking("create_game", true));
    expect(result.current.onPurchaseFailed({ userCancelled: true })).toBe(true);
    expect(mockTrack).toHaveBeenCalledWith("purchase_cancelled", { source: "create_game" });

    expect(result.current.onPurchaseFailed({ code: "10", message: "secret detail" })).toBe(false);
    expect(mockTrack).toHaveBeenCalledWith("purchase_failed", {
      source: "create_game",
      reason: "network",
    });
    expect(JSON.stringify(mockTrack.mock.calls)).not.toMatch(/secret detail/);
  });

  it("tracks whether premium was granted after a purchase", () => {
    const { result } = renderHook(() => usePaywallTracking("game_details_upgrade", true));
    result.current.onPremiumGranted();
    result.current.onPremiumGrantFailed();
    expect(mockTrack).toHaveBeenCalledWith("premium_granted", { source: "game_details_upgrade" });
    expect(mockTrack).toHaveBeenCalledWith("premium_grant_failed", {
      source: "game_details_upgrade",
    });
  });
});
