import type { AnalyticsEventName } from "./events";

// Runtime mirror of the typed catalogue so a renamed event fails this test
// as well as tsc. Props themselves are enforced by EventProps on track().
const EVENT_NAMES = [
  "screen_viewed",
  "signed_up",
  "signed_in",
  "sign_in_failed",
  "game_created",
  "questions_saved",
  "invite_sent",
  "invite_opened",
  "game_started",
  "game_answered",
  "results_revealed",
  "game_completed",
  "paywall_viewed",
  "paywall_dismissed",
  "purchase_completed",
  "analytics_opted_out",
] as const satisfies readonly AnalyticsEventName[];

describe("event catalogue", () => {
  it("lists the stable Mr & Mrs event names", () => {
    expect(EVENT_NAMES).toHaveLength(16);
    expect(EVENT_NAMES).toContain("game_answered");
    expect(EVENT_NAMES).not.toContain("purchase_restored");
  });
});
