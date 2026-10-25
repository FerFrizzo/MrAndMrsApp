import { track, type AuthMethod } from "../../lib/analytics";
import { classifyAuthError } from "./classifyAuthError";

// Email sign-up and sign-in are separate screens. Google and Apple use one
// call for both; pass isNewUser from isFreshAuthUser.
export function trackAuthResult(isNewUser: boolean, method: AuthMethod): void {
  try {
    track(isNewUser ? "signed_up" : "signed_in", { method });
  } catch {
    // Analytics must never break sign-in.
  }
}

// Classifies a failed sign-in/sign-up, records it, and returns a safe message.
// Only the classified reason is sent — never the raw error.
export function reportAuthError(error: unknown, method: AuthMethod): string {
  const { kind, message } = classifyAuthError(error);
  try {
    track("sign_in_failed", { method, reason: kind });
  } catch {
    // Analytics must never break sign-in.
  }
  return message;
}

// Email sign-up: an existing email comes back as a fake success (see
// isExistingEmailSignUp), which is a failed sign-up, not a new user.
export function trackEmailSignUp(
  data: { user?: { identities?: unknown[] | null } | null } | null | undefined,
): void {
  try {
    if (isExistingEmailSignUp(data)) {
      track("sign_in_failed", { method: "email", reason: "email-in-use" });
    } else {
      track("signed_up", { method: "email" });
    }
  } catch {
    // Analytics must never break sign-up.
  }
}

const NEW_USER_WINDOW_MS = 60_000;

// Supabase does not flag isNewUser on signInWithIdToken. A user created in
// the last minute is treated as a sign-up; everyone else is a sign-in.
export function isFreshAuthUser(createdAt: string | null | undefined, now = Date.now()): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  const age = now - created;
  return age >= 0 && age < NEW_USER_WINDOW_MS;
}

// With email confirmation on, Supabase answers a sign-up for an email that is
// already registered with a success and a user that has no identities, so
// the account is not new and must not count as signed_up.
export function isExistingEmailSignUp(
  data: { user?: { identities?: unknown[] | null } | null } | null | undefined,
): boolean {
  const identities = data?.user?.identities;
  return Array.isArray(identities) && identities.length === 0;
}
