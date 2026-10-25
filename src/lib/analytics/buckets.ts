import type { QuestionCountBucket, QuestionPackageId } from "./events";

const PACKAGE_IDS: readonly QuestionPackageId[] = ["romantic", "fun", "deep", "wedding"];

export function parseQuestionPackageId(value: unknown): QuestionPackageId | null {
  if (typeof value !== "string") return null;
  return (PACKAGE_IDS as readonly string[]).includes(value) ? (value as QuestionPackageId) : null;
}

// Coarse buckets only — never send the exact question count.
export function questionCountBucket(count: number): QuestionCountBucket | null {
  if (!Number.isFinite(count) || count < 1) return null;
  if (count <= 5) return "1-5";
  if (count <= 10) return "6-10";
  return "11+";
}

export function gameCreatedProps(packageId: QuestionPackageId | null): {
  from_package: boolean;
  package_id?: QuestionPackageId;
} {
  if (packageId) return { from_package: true, package_id: packageId };
  return { from_package: false };
}
