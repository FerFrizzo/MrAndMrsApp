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
