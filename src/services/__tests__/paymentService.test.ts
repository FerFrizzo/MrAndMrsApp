const mockConfigure = jest.fn((..._a: unknown[]) => {});
const mockLogIn = jest.fn(async (..._a: unknown[]) => ({}));
const mockLogOut = jest.fn(async (..._a: unknown[]) => ({}));
const mockIsAnonymous = jest.fn(async (..._a: unknown[]) => false);

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    configure: (...a: unknown[]) => mockConfigure(...a),
    logIn: (...a: unknown[]) => mockLogIn(...a),
    logOut: (...a: unknown[]) => mockLogOut(...a),
    isAnonymous: (...a: unknown[]) => mockIsAnonymous(...a),
  },
}));

import {
  __resetPurchasesForTests,
  configurePurchases,
  setPurchasesUser,
} from "../paymentService";

beforeEach(() => {
  jest.clearAllMocks();
  __resetPurchasesForTests();
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

// RevenueCat must use the Supabase uid (also PostHog's distinct id) so a
// purchase can be tied to the person who made it.
describe("RevenueCat user identity", () => {
  // AnalyticsInitializer is a child of App, so its effect (sign-in) runs
  // before App's effect configures RevenueCat.
  it("applies a user that arrives before configure once configured", async () => {
    await setPurchasesUser("u1");
    expect(mockLogIn).not.toHaveBeenCalled();

    configurePurchases("key");
    await new Promise((r) => setImmediate(r));

    expect(mockConfigure).toHaveBeenCalledWith({ apiKey: "key" });
    expect(mockLogIn).toHaveBeenCalledTimes(1);
    expect(mockLogIn).toHaveBeenCalledWith("u1");
  });

  it("does not log the same user in twice", async () => {
    configurePurchases("key");
    await setPurchasesUser("u1");
    await setPurchasesUser("u1");

    expect(mockLogIn).toHaveBeenCalledTimes(1);
  });

  // logOut() throws when the current customer is already anonymous.
  it("skips logOut for an anonymous customer", async () => {
    configurePurchases("key");
    mockIsAnonymous.mockResolvedValueOnce(true);

    await setPurchasesUser(null);

    expect(mockLogOut).not.toHaveBeenCalled();
  });

  it("logs out an identified customer on sign-out", async () => {
    configurePurchases("key");
    mockIsAnonymous.mockResolvedValueOnce(false);

    await setPurchasesUser(null);

    expect(mockLogOut).toHaveBeenCalledTimes(1);
  });

  it("never throws when RevenueCat fails", async () => {
    configurePurchases("key");
    mockLogIn.mockRejectedValueOnce(new Error("network"));

    await expect(setPurchasesUser("u1")).resolves.toBeUndefined();
  });
});
