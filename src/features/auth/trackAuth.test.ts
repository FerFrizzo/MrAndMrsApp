const mockTrack = jest.fn();
jest.mock("../../lib/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

import { isFreshAuthUser, reportAuthError, trackAuthResult } from "./trackAuth";

beforeEach(() => jest.clearAllMocks());

it("tracks signed_up for a new user", () => {
  trackAuthResult(true, "google");
  expect(mockTrack).toHaveBeenCalledWith("signed_up", { method: "google" });
});

it("tracks signed_in for a returning user", () => {
  trackAuthResult(false, "apple");
  expect(mockTrack).toHaveBeenCalledWith("signed_in", { method: "apple" });
});

it("never throws when tracking throws", () => {
  mockTrack.mockImplementationOnce(() => {
    throw new Error("posthog down");
  });
  expect(() => trackAuthResult(true, "email")).not.toThrow();
});

describe("isFreshAuthUser", () => {
  const now = Date.parse("2026-10-25T12:00:00.000Z");
  it("treats a just-created user as new", () => {
    expect(isFreshAuthUser("2026-10-25T11:59:30.000Z", now)).toBe(true);
  });
  it("treats an older user as returning", () => {
    expect(isFreshAuthUser("2026-10-20T11:59:30.000Z", now)).toBe(false);
    expect(isFreshAuthUser(null, now)).toBe(false);
  });
});

describe("reportAuthError", () => {
  it("tracks sign_in_failed with the classified reason and returns a safe message", () => {
    const message = reportAuthError({ code: "invalid_credentials" }, "email");
    expect(mockTrack).toHaveBeenCalledWith("sign_in_failed", {
      method: "email",
      reason: "wrong-credentials",
    });
    expect(message).toMatch(/email or password is incorrect/i);
  });

  it("tracks cancellations so abandoned social sign-ins are visible", () => {
    reportAuthError({ code: "ERR_REQUEST_CANCELED" }, "apple");
    expect(mockTrack).toHaveBeenCalledWith("sign_in_failed", {
      method: "apple",
      reason: "cancelled",
    });
    reportAuthError({ code: "SIGN_IN_CANCELLED" }, "google");
    expect(mockTrack).toHaveBeenCalledWith("sign_in_failed", {
      method: "google",
      reason: "cancelled",
    });
  });

  it("classifies supabase messages without sending them", () => {
    reportAuthError({ message: "User already registered" }, "email");
    expect(mockTrack).toHaveBeenCalledWith("sign_in_failed", {
      method: "email",
      reason: "email-in-use",
    });
  });

  it("never sends the raw error message", () => {
    reportAuthError(
      { code: "invalid_credentials", message: "Invalid login credentials for a@b.com" },
      "apple",
    );
    expect(JSON.stringify(mockTrack.mock.calls)).not.toMatch(/a@b\.com|Invalid login/);
  });

  it("still returns a message when tracking throws", () => {
    mockTrack.mockImplementationOnce(() => {
      throw new Error("posthog down");
    });
    expect(reportAuthError({ code: "auth/network-request-failed" }, "email")).toMatch(/connection/i);
  });
});
