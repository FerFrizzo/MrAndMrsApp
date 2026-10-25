// Typed event catalogue. track() only accepts names and props declared here,
// so a typo or an unexpected (possibly sensitive) prop fails tsc. Keep props to
// enums, booleans, buckets, and route templates — never names, emails,
// question text, answers, media URLs, access codes, or game/user UUIDs.

export type PaywallSource = "create_game" | "media_upload" | "account" | "unknown";

export type AuthMethod = "email" | "google" | "apple";

// Classified sign-in failure. Never send the raw Supabase/Firebase/Apple
// message — it can echo the user's email.
export type AuthErrorKind =
  | "credential-in-use"
  | "email-in-use"
  | "wrong-credentials"
  | "invalid-email"
  | "weak-password"
  | "too-many-requests"
  | "user-disabled"
  | "popup-closed"
  | "network"
  | "unsupported-platform"
  | "cancelled"
  | "unknown";

export type QuestionPackageId = "romantic" | "fun" | "deep" | "wedding";

export type QuestionCountBucket = "1-5" | "6-10" | "11+";

export type GameRole = "creator" | "partner";

type NoProps = Record<string, never>;

export type EventProps = {
  screen_viewed: { route: string };
  signed_up: { method: AuthMethod };
  signed_in: { method: AuthMethod };
  sign_in_failed: { method: AuthMethod; reason: AuthErrorKind };
  game_created: { from_package: boolean; package_id?: QuestionPackageId };
  questions_saved: { count_bucket: QuestionCountBucket };
  invite_sent: { channel: "email" | "access_code" };
  invite_opened: NoProps;
  game_started: { role: GameRole };
  game_answered: { has_media: boolean };
  results_revealed: NoProps;
  game_completed: NoProps;
  paywall_viewed: { source: PaywallSource };
  paywall_dismissed: { source: PaywallSource };
  purchase_completed: { source: PaywallSource; product_id: string };
  analytics_opted_out: NoProps;
};

export type AnalyticsEventName = keyof EventProps;
