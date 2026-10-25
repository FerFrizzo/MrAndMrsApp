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
