import type { PaywallSource } from "./events";

export const PAYWALL_SOURCES: readonly PaywallSource[] = [
  "create_game",
  "media_upload",
  "account",
  "unknown",
];

// The source can arrive from navigation params or other untrusted input.
export function parsePaywallSource(value: string | string[] | undefined): PaywallSource {
  if (typeof value !== "string") return "unknown";
  return (PAYWALL_SOURCES as readonly string[]).includes(value)
    ? (value as PaywallSource)
    : "unknown";
}
