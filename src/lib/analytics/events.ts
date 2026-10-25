// Typed event catalogue. track() only accepts names and props declared here,
// so a typo or an unexpected (possibly sensitive) prop fails tsc. Keep props to
// enums, booleans, buckets, and route templates — never names, emails,
// question text, answers, media URLs, access codes, or game/user UUIDs.

export type PaywallSource = "create_game" | "game_details_upgrade" | "dashboard_pricing" | "unknown";

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
  | "email-not-confirmed"
  | "user-disabled"
  | "popup-closed"
  | "network"
  | "unsupported-platform"
  | "cancelled"
  | "unknown";

export type QuestionPackageId = "romantic" | "fun" | "deep" | "wedding";

export type QuestionCountBucket = "1-5" | "6-10" | "11+";

export type GameRole = "creator" | "partner";

// Where an invite was sent from: the end of CreateGame, or a resend from
// GameDetails.
export type InviteFrom = "create_game" | "game_details";

// Classified store/RevenueCat failure. Never send the raw store message.
export type PurchaseErrorKind =
  | "store_problem"
  | "not_allowed"
  | "product_unavailable"
  | "network"
  | "payment_pending"
  | "unknown";

type NoProps = Record<string, never>;

export type EventProps = {
  screen_viewed: { route: string };
  signed_up: { method: AuthMethod };
  signed_in: { method: AuthMethod };
  sign_in_failed: { method: AuthMethod; reason: AuthErrorKind };
  password_reset_requested: NoProps;
  password_reset_failed: { reason: AuthErrorKind };
  game_created: { from_package: boolean; package_id?: QuestionPackageId };
  questions_saved: { count_bucket: QuestionCountBucket };
  invite_sent: { channel: "email"; from: InviteFrom };
  invite_failed: { from: InviteFrom };
  invite_opened: NoProps;
  game_started: { role: GameRole };
  game_answered: { has_media: boolean };
  answers_submit_failed: NoProps;
  results_revealed: NoProps;
  game_completed: NoProps;
  paywall_viewed: { source: PaywallSource };
  paywall_dismissed: { source: PaywallSource };
  purchase_completed: { source: PaywallSource; product_id: string };
  purchase_cancelled: { source: PaywallSource };
  purchase_failed: { source: PaywallSource; reason: PurchaseErrorKind };
  // The store charged the user; did the game actually become premium?
  premium_granted: { source: PaywallSource };
  premium_grant_failed: { source: PaywallSource };
  analytics_opted_out: NoProps;
};

export type AnalyticsEventName = keyof EventProps;
