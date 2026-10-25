// Supabase stores auth emails lowercased, but partner emails are typed by the
// creator. Compare and store them normalised, or a partner invited as
// "Ana@…" never sees their game.
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeEmail(a);
  return left !== "" && left === normalizeEmail(b);
}

type InviteGame = { creator_id?: string; partner_interviewed_email?: string; status?: string | null };

// The invite has been sent (ready_to_play) and the partner has not answered.
export function isInvitedPartnerBeforeAnswering(
  game: InviteGame,
  userId: string,
  userEmail: string | null | undefined,
): boolean {
  return (
    game.creator_id !== userId &&
    sameEmail(game.partner_interviewed_email, userEmail) &&
    game.status === "ready_to_play"
  );
}

// Pattern for a case-insensitive exact match with PostgREST .ilike(). Rows
// saved before emails were normalised may be mixed case, so .eq() misses them.
// `\`, `%` and `_` are escaped so they match literally (`_` is common in
// emails). PostgREST also treats `*` as a wildcard and it cannot be escaped,
// so the caller falls back to .eq() for such addresses (returns null).
export function exactEmailPattern(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.includes("*")) return null;
  return normalized.replace(/[\\%_]/g, (c) => `\\${c}`);
}
