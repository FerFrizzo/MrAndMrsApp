import { Modal } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

const mockTrack = jest.fn();

jest.mock("../../services/paymentService", () => ({
  getProductPrices: jest.fn(async () => ({ premium: "£2.99" })),
  purchaseGame: jest.fn(),
}));
jest.mock("../../lib/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

import { PaywallModal } from "../PaywallModal";

beforeEach(() => jest.clearAllMocks());

// Android back used to call onContinueFree, which in CreateGame creates the
// game and emails the partner — a dismissal must never do that.
describe("PaywallModal back/dismiss", () => {
  it("closes without creating the game when onClose is given", async () => {
    const onClose = jest.fn();
    const onContinueFree = jest.fn();
    const screen = render(
      <PaywallModal
        visible
        source="create_game"
        onUpgradeSuccess={jest.fn()}
        onContinueFree={onContinueFree}
        onClose={onClose}
      />,
    );
    await screen.findByText(/£2\.99/);

    fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onContinueFree).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("paywall_dismissed", { source: "create_game" });
  });

  // A double tap would create the game twice and email the partner twice.
  it("continues free only once when the free button is tapped twice", async () => {
    const onContinueFree = jest.fn();
    const screen = render(
      <PaywallModal
        visible
        source="create_game"
        onUpgradeSuccess={jest.fn()}
        onContinueFree={onContinueFree}
        onClose={jest.fn()}
      />,
    );
    await screen.findByText(/£2\.99/);

    fireEvent.press(screen.getByText("Continue with free game"));
    fireEvent.press(screen.getByText("Continue with free game"));

    expect(onContinueFree).toHaveBeenCalledTimes(1);
  });

  it("falls back to continuing free when onClose is absent", async () => {
    const onContinueFree = jest.fn();
    const screen = render(
      <PaywallModal
        visible
        source="game_details_upgrade"
        onUpgradeSuccess={jest.fn()}
        onContinueFree={onContinueFree}
      />,
    );
    await screen.findByText(/£2\.99/);

    fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

    expect(onContinueFree).toHaveBeenCalledTimes(1);
  });
});
