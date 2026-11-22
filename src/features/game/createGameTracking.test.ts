import { blockReasonForToastKey, stepName } from "./createGameTracking";

describe("stepName", () => {
  it("names the three CreateGame steps", () => {
    expect(stepName(1)).toBe("details");
    expect(stepName(2)).toBe("questions");
    expect(stepName(3)).toBe("settings");
  });
  it("returns null for an unknown step", () => {
    expect(stepName(4)).toBeNull();
  });
});

describe("blockReasonForToastKey", () => {
  it.each([
    ["createGame.fillAllFields", "missing_fields"],
    ["createGame.invalidEmail", "invalid_email"],
    ["createGame.invalidPartnerEmail", "invalid_partner_email"],
    ["createGame.fillAllQuestions", "empty_question"],
    ["createGame.multipleChoiceMin", "multiple_choice_options"],
    ["createGame.atLeastOneQuestion", "no_questions"],
    ["createGame.failedSaveDetails", "save_failed"],
    ["createGame.failedSaveQuestion", "save_failed"],
    ["createGame.saveError", "save_failed"],
  ])("maps %s to %s", (key, reason) => {
    expect(blockReasonForToastKey(key)).toBe(reason);
  });

  // Success and info toasts are not blocks and must not send an event.
  it("returns null for a toast that is not a block", () => {
    expect(blockReasonForToastKey("createGame.gameSaved")).toBeNull();
  });
});
