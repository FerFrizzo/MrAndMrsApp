import type { CreateGameBlockReason, CreateGameStep } from "../../lib/analytics";

const STEPS: Record<number, CreateGameStep> = { 1: "details", 2: "questions", 3: "settings" };

export function stepName(step: number): CreateGameStep | null {
  return STEPS[step] ?? null;
}

// Maps the i18n key of a CreateGame error toast to an analytics reason. Keys
// that are not blocks (success/info toasts) map to null and send nothing.
const BLOCK_REASONS: Record<string, CreateGameBlockReason> = {
  "createGame.fillAllFields": "missing_fields",
  "createGame.invalidEmail": "invalid_email",
  "createGame.invalidPartnerEmail": "invalid_partner_email",
  "createGame.fillAllQuestions": "empty_question",
  "createGame.multipleChoiceMin": "multiple_choice_options",
  "createGame.atLeastOneQuestion": "no_questions",
  "createGame.failedSaveDetails": "save_failed",
  "createGame.failedSaveQuestion": "save_failed",
  "createGame.saveError": "save_failed",
};

export function blockReasonForToastKey(key: string): CreateGameBlockReason | null {
  return BLOCK_REASONS[key] ?? null;
}
