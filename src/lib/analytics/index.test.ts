// posthog-react-native is replaced by a recording fake so we can assert what
// would be sent. Names carry the `mock` prefix because babel-plugin-jest-hoist
// hoists the factories above these declarations.
const mockCapture = jest.fn();
const mockIdentify = jest.fn();
const mockReset = jest.fn();
const mockOptOut = jest.fn(async () => {});
const mockOptIn = jest.fn(async () => {});
const mockFlush = jest.fn(async () => {});
const mockCtor = jest.fn();

jest.mock("posthog-react-native", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((...args: unknown[]) => {
    mockCtor(...args);
    return {
      capture: mockCapture,
      identify: mockIdentify,
      reset: mockReset,
      optOut: mockOptOut,
      optIn: mockOptIn,
      flush: mockFlush,
    };
  }),
}));

jest.mock("../deviceStorage", () => jest.requireActual("../../test-utils/deviceStorageMock"));

import { mockDeviceStore } from "../../test-utils/deviceStorageMock";
import {
  DEFAULT_HOST,
  __resetAnalyticsForTests,
  identify,
  initAnalytics,
  isOptedOut,
  reset,
  setOptOut,
  shouldEnable,
  track,
  type AnalyticsConfig,
} from "./index";

const enabled: AnalyticsConfig = {
  apiKey: "phc_test",
  host: DEFAULT_HOST,
  isDev: false,
  enableInDev: false,
  isExpoGo: false,
  isTest: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDeviceStore.clear();
  __resetAnalyticsForTests();
});

describe("shouldEnable", () => {
  it("is on for a production build with a key", () => {
    expect(shouldEnable(enabled)).toBe(true);
  });
  it("is off without a key", () => {
    expect(shouldEnable({ ...enabled, apiKey: "" })).toBe(false);
  });
  it("is off in Expo Go", () => {
    expect(shouldEnable({ ...enabled, isExpoGo: true })).toBe(false);
  });
  it("is off under Jest", () => {
    expect(shouldEnable({ ...enabled, isTest: true })).toBe(false);
  });
  it("is off in __DEV__ unless explicitly enabled", () => {
    expect(shouldEnable({ ...enabled, isDev: true })).toBe(false);
    expect(shouldEnable({ ...enabled, isDev: true, enableInDev: true })).toBe(true);
  });
});

describe("initAnalytics", () => {
  it("creates an EU client with lifecycle events and no session replay", async () => {
    await initAnalytics(enabled);
    expect(mockCtor).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        host: "https://eu.i.posthog.com",
        captureAppLifecycleEvents: true,
        enableSessionReplay: false,
      }),
    );
  });

  it("disables GeoIP enrichment", async () => {
    await initAnalytics(enabled);
    expect(mockCtor).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ disableGeoip: true }),
    );
  });

  it("does nothing when disabled, and track is then a no-op", async () => {
    await initAnalytics({ ...enabled, apiKey: "" });
    track("game_created", { from_package: false });
    expect(mockCtor).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("only initialises once", async () => {
    await initAnalytics(enabled);
    await initAnalytics(enabled);
    expect(mockCtor).toHaveBeenCalledTimes(1);
  });

  it("swallows a constructor failure and stays a no-op", async () => {
    mockCtor.mockImplementationOnce(() => {
      throw new Error("native module missing");
    });
    jest.spyOn(console, "warn").mockImplementationOnce(() => {});
    await expect(initAnalytics(enabled)).resolves.toBeUndefined();
    expect(() => track("results_revealed")).not.toThrow();
    expect(mockCapture).not.toHaveBeenCalled();
  });
});

describe("track", () => {
  it("forwards the event and props", async () => {
    await initAnalytics(enabled);
    track("invite_sent", { channel: "email" });
    expect(mockCapture).toHaveBeenCalledWith("invite_sent", { channel: "email" });
  });

  it("sends an empty props object for prop-less events", async () => {
    await initAnalytics(enabled);
    track("invite_opened");
    expect(mockCapture).toHaveBeenCalledWith("invite_opened", {});
  });

  it("never throws when the SDK throws", async () => {
    await initAnalytics(enabled);
    mockCapture.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(() => track("results_revealed")).not.toThrow();
  });

  it("drops payloads that contain an email or a uuid", async () => {
    await initAnalytics(enabled);
    jest.spyOn(console, "warn").mockImplementation(() => {});
    track("screen_viewed", { route: "user@example.com" });
    track("screen_viewed", { route: "/games/11111111-1111-4111-8111-111111111111" });
    expect(mockCapture).not.toHaveBeenCalled();
  });
});

describe("events before init", () => {
  it("delivers an event tracked before init once init completes", async () => {
    track("screen_viewed", { route: "/Dashboard" });
    expect(mockCapture).not.toHaveBeenCalled();
    await initAnalytics(enabled);
    expect(mockCapture).toHaveBeenCalledWith("screen_viewed", { route: "/Dashboard" });
  });

  it("delivers queued events in order, before later events", async () => {
    track("screen_viewed", { route: "/SignIn" });
    track("game_created", { from_package: false });
    await initAnalytics(enabled);
    track("invite_opened");
    expect(mockCapture.mock.calls.map((c) => c[0])).toEqual([
      "screen_viewed",
      "game_created",
      "invite_opened",
    ]);
  });

  it("delivers events tracked while init is in flight", async () => {
    const pending = initAnalytics(enabled);
    track("game_created", { from_package: true, package_id: "romantic" });
    await pending;
    expect(mockCapture).toHaveBeenCalledWith("game_created", {
      from_package: true,
      package_id: "romantic",
    });
  });

  it("drops queued events when analytics is disabled", async () => {
    track("game_created", { from_package: false });
    await initAnalytics({ ...enabled, apiKey: "" });
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("drops queued events when the user has opted out", async () => {
    mockDeviceStore.set("mrandmrs.analytics.optOut", "1");
    track("game_created", { from_package: false });
    await initAnalytics(enabled);
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("drops queued events when the client fails to start", async () => {
    mockCtor.mockImplementationOnce(() => {
      throw new Error("native module missing");
    });
    jest.spyOn(console, "warn").mockImplementationOnce(() => {});
    track("game_created", { from_package: false });
    await initAnalytics(enabled);
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("bounds the queue at 50 events, keeping the earliest", async () => {
    for (let i = 0; i < 60; i++) track("screen_viewed", { route: `/Screen${i}` });
    await initAnalytics(enabled);
    expect(mockCapture).toHaveBeenCalledTimes(50);
    expect(mockCapture).toHaveBeenNthCalledWith(1, "screen_viewed", { route: "/Screen0" });
    expect(mockCapture).toHaveBeenLastCalledWith("screen_viewed", { route: "/Screen49" });
  });

  it("does not queue once a disabled init has completed", async () => {
    await initAnalytics({ ...enabled, apiKey: "" });
    track("game_created", { from_package: false });
    __resetAnalyticsForTests();
    await initAnalytics(enabled);
    expect(mockCapture).not.toHaveBeenCalled();
  });
});

describe("identify / reset", () => {
  it("identifies by uid only", async () => {
    await initAnalytics(enabled);
    identify("uid-1");
    expect(mockIdentify).toHaveBeenCalledWith("uid-1");
  });

  it("applies an identify that arrived before init", async () => {
    identify("uid-early");
    expect(mockIdentify).not.toHaveBeenCalled();
    await initAnalytics(enabled);
    expect(mockIdentify).toHaveBeenCalledWith("uid-early");
  });

  it("resets the client and forgets the uid", async () => {
    await initAnalytics(enabled);
    identify("uid-1");
    reset();
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});

describe("opt-out", () => {
  it("sends analytics_opted_out, then opts out and persists", async () => {
    await initAnalytics(enabled);
    await setOptOut(true);
    expect(mockCapture).toHaveBeenCalledWith("analytics_opted_out", {});
    expect(mockOptOut).toHaveBeenCalledTimes(1);
    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockCapture.mock.invocationCallOrder[0]).toBeLessThan(
      mockFlush.mock.invocationCallOrder[0] as number,
    );
    expect(mockFlush.mock.invocationCallOrder[0]).toBeLessThan(
      mockOptOut.mock.invocationCallOrder[0] as number,
    );
    expect(await isOptedOut()).toBe(true);
    track("game_created", { from_package: false });
    expect(mockCapture).toHaveBeenCalledTimes(1);
  });

  it("still opts out and persists when the flush fails", async () => {
    await initAnalytics(enabled);
    mockFlush.mockRejectedValueOnce(new Error("network"));
    await setOptOut(true);
    expect(mockOptOut).toHaveBeenCalledTimes(1);
    expect(await isOptedOut()).toBe(true);
  });

  it("applies a persisted opt-out on init", async () => {
    mockDeviceStore.set("mrandmrs.analytics.optOut", "1");
    await initAnalytics(enabled);
    expect(mockOptOut).toHaveBeenCalledTimes(1);
    track("game_created", { from_package: false });
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("re-applies opt-out after reset", async () => {
    await initAnalytics(enabled);
    await setOptOut(true);
    mockOptOut.mockClear();
    reset();
    expect(mockOptOut).toHaveBeenCalledTimes(1);
  });

  it("opting back in resumes sending", async () => {
    await initAnalytics(enabled);
    await setOptOut(true);
    await setOptOut(false);
    expect(mockOptIn).toHaveBeenCalledTimes(1);
    expect(await isOptedOut()).toBe(false);
    track("game_created", { from_package: false });
    expect(mockCapture).toHaveBeenLastCalledWith("game_created", { from_package: false });
  });

  it("isOptedOut defaults to false", async () => {
    expect(await isOptedOut()).toBe(false);
  });

  it("isOptedOut returns false when storage throws", async () => {
    const { deviceStorage } = jest.requireMock("../deviceStorage") as {
      deviceStorage: { getItem: jest.Mock };
    };
    deviceStorage.getItem.mockRejectedValueOnce(new Error("locked"));
    expect(await isOptedOut()).toBe(false);
  });
});
