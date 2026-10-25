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
    const { result } = renderHook(() => usePaywallTracking("account", true));
    result.current.onPurchaseCompleted("com.ferfrizzo.MrAndMrsApp.premium_game");
    result.current.onDismissed();
    expect(mockTrack).toHaveBeenCalledWith("purchase_completed", {
      source: "account",
      product_id: "com.ferfrizzo.MrAndMrsApp.premium_game",
    });
    expect(mockTrack).toHaveBeenCalledWith("paywall_dismissed", { source: "account" });
    expect(JSON.stringify(mockTrack.mock.calls)).not.toMatch(/price|\$/);
  });
});
