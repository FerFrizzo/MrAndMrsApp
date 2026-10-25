import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockPurchaseGame = jest.fn();
const mockTrack = jest.fn();

jest.mock("../../services/paymentService", () => ({
  getProductPrices: jest.fn(async () => ({ premium: "£2.99" })),
  purchaseGame: (...args: unknown[]) => mockPurchaseGame(...args),
}));
jest.mock("../../services/gameService", () => ({ getUserGames: jest.fn() }));
jest.mock("../../services/authService", () => ({ signOut: jest.fn() }));
jest.mock("../../context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("../../lib/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

import { PricingModal } from "../DashboardScreen";

beforeEach(() => jest.clearAllMocks());

// The Dashboard pricing sheet used to call purchaseGame() with no game to
// attach the purchase to, so the user paid and got nothing.
describe("PricingModal", () => {
  it("sends the user to create a premium game and never charges", async () => {
    const onCreatePremium = jest.fn();
    const screen = render(
      <PricingModal visible onClose={jest.fn()} onCreatePremium={onCreatePremium} />,
    );
    await waitFor(() => screen.getByText("£2.99"));

    fireEvent.press(screen.getByText("pricing.createPremium"));

    expect(onCreatePremium).toHaveBeenCalledTimes(1);
    expect(mockPurchaseGame).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("paywall_viewed", { source: "dashboard_pricing" });
  });
});
