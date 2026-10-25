import { act, render } from "@testing-library/react-native";
import { emitNavigationState, __resetNavigationBridgeForTests } from "./navigationBridge";

const mockInit = jest.fn(async () => {});
const mockIdentify = jest.fn();
const mockReset = jest.fn();
const mockTrack = jest.fn();
jest.mock("./index", () => ({
  initAnalytics: () => mockInit(),
  identify: (uid: string) => mockIdentify(uid),
  reset: () => mockReset(),
  track: (...args: unknown[]) => mockTrack(...args),
}));

let mockAuth: { isLoading: boolean; user: { id: string } | null } = {
  isLoading: true,
  user: null,
};
jest.mock("../../context/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

import { AnalyticsInitializer } from "./AnalyticsInitializer";

beforeEach(() => {
  jest.clearAllMocks();
  __resetNavigationBridgeForTests();
  mockAuth = { isLoading: true, user: null };
});

describe("AnalyticsInitializer", () => {
  it("initialises once on mount", () => {
    const { rerender } = render(<AnalyticsInitializer />);
    rerender(<AnalyticsInitializer />);
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it("identifies when auth is ready", () => {
    const { rerender } = render(<AnalyticsInitializer />);
    mockAuth = { isLoading: false, user: { id: "uid-1" } };
    rerender(<AnalyticsInitializer />);
    expect(mockIdentify).toHaveBeenCalledWith("uid-1");
  });

  it("resets on sign-out but not on a cold unauthenticated start", () => {
    mockAuth = { isLoading: false, user: null };
    const { rerender } = render(<AnalyticsInitializer />);
    expect(mockReset).not.toHaveBeenCalled();

    mockAuth = { isLoading: false, user: { id: "uid-1" } };
    rerender(<AnalyticsInitializer />);
    mockAuth = { isLoading: false, user: null };
    rerender(<AnalyticsInitializer />);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("tracks screen views as route templates, once per change", () => {
    render(<AnalyticsInitializer />);
    act(() => {
      emitNavigationState({
        index: 0,
        routes: [{ name: "SignIn" }],
      });
    });
    expect(mockTrack).toHaveBeenCalledWith("screen_viewed", { route: "/SignIn" });

    act(() => {
      emitNavigationState({
        index: 0,
        routes: [{ name: "SignIn" }],
      });
    });
    expect(mockTrack).toHaveBeenCalledTimes(1);

    act(() => {
      emitNavigationState({
        index: 0,
        routes: [
          {
            name: "GameDetails",
            params: { gameId: "11111111-1111-4111-8111-111111111111" },
          },
        ],
      });
    });
    expect(mockTrack).toHaveBeenLastCalledWith("screen_viewed", { route: "/GameDetails" });
    expect(JSON.stringify(mockTrack.mock.calls)).not.toMatch(/11111111/);
  });
});
