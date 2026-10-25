import type { AuthErrorKind } from "../../lib/analytics";

// Friendly mapping for Supabase, Google Sign-In, and Sign in with Apple.
// Callers may show `message`. Analytics may only keep `kind` — never `message`,
// because provider text can echo the user's email.

type AuthLikeError = { code?: string | number; message?: string; status?: number };

const SAFE_MESSAGE: Record<AuthErrorKind, string> = {
  "credential-in-use": "That sign-in is already linked to another account.",
  "email-in-use": "An account with this email already exists. Try signing in instead.",
  "wrong-credentials": "Email or password is incorrect.",
  "invalid-email": "Enter a valid email address.",
  "weak-password": "Choose a stronger password.",
  "too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "user-disabled": "This account has been disabled. Contact support for help.",
  "popup-closed": "Sign-in was cancelled.",
  network: "Couldn't reach the server. Check your connection and try again.",
  "unsupported-platform": "Sign-in isn't available on this device.",
  cancelled: "Sign-in was cancelled.",
  unknown: "Something went wrong. Try again in a moment.",
};

function readCode(error: unknown): string {
  const code = (error as AuthLikeError | null)?.code;
  if (typeof code === "number") return String(code);
  if (typeof code === "string") return code;
  return "";
}

function readMessage(error: unknown): string {
  const message = (error as AuthLikeError | null)?.message;
  return typeof message === "string" ? message : "";
}

export function classifyAuthError(error: unknown): { kind: AuthErrorKind; message: string } {
  const code = readCode(error);
  const message = readMessage(error);
  const kind = kindFromCode(code) ?? kindFromMessage(message) ?? "unknown";
  return { kind, message: SAFE_MESSAGE[kind] };
}

function kindFromCode(code: string): AuthErrorKind | null {
  switch (code) {
    case "auth/credential-already-in-use":
    case "auth/account-exists-with-different-credential":
    case "identity_already_exists":
      return "credential-in-use";
    case "auth/email-already-in-use":
    case "user_already_exists":
    case "email_exists":
    case "email_already_exists":
      return "email-in-use";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "invalid_credentials":
    case "invalid_grant":
    case "user_not_found":
      return "wrong-credentials";
    case "auth/invalid-email":
    case "email_address_invalid":
      return "invalid-email";
    case "auth/weak-password":
    case "weak_password":
      return "weak-password";
    case "auth/too-many-requests":
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
    case "too_many_requests":
      return "too-many-requests";
    case "auth/user-disabled":
    case "user_banned":
    case "user_disabled":
      return "user-disabled";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "popup-closed";
    case "SIGN_IN_CANCELLED":
    case "ERR_REQUEST_CANCELED":
    case "ERR_CANCELED":
    case "12501":
    case "-5":
      return "cancelled";
    case "auth/network-request-failed":
    case "network_error":
      return "network";
    case "auth/operation-not-supported-in-this-environment":
    case "auth/unsupported-persistence-type":
    case "PLAY_SERVICES_NOT_AVAILABLE":
    case "provider_disabled":
      return "unsupported-platform";
    default:
      return null;
  }
}

function kindFromMessage(message: string): AuthErrorKind | null {
  if (!message) return null;
  if (/cancel/i.test(message)) return "cancelled";
  if (/network|failed to fetch|offline|internet/i.test(message)) return "network";
  if (/already registered|already exists|already been registered/i.test(message)) return "email-in-use";
  if (/invalid login|invalid credentials|wrong password/i.test(message)) return "wrong-credentials";
  if (/invalid email|unable to validate email|email address/i.test(message) && /invalid/i.test(message)) {
    return "invalid-email";
  }
  if (/password/i.test(message) && /weak|at least|too short|should be/i.test(message)) return "weak-password";
  if (/rate limit|too many/i.test(message)) return "too-many-requests";
  if (/disabled|banned/i.test(message)) return "user-disabled";
  return null;
}
