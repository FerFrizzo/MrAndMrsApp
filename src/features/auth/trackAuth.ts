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
