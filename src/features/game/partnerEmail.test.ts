import {
  exactEmailPattern,
  isInvitedPartnerBeforeAnswering,
  normalizeEmail,
  sameEmail,
} from "./partnerEmail";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ana.Silva@Example.COM ")).toBe("ana.silva@example.com");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("sameEmail", () => {
  it("ignores case and surrounding spaces", () => {
    expect(sameEmail("Ana@Example.com", "ana@example.com ")).toBe(true);
  });
  it("never matches empty values", () => {
    expect(sameEmail("", "")).toBe(false);
    expect(sameEmail(null, undefined)).toBe(false);
  });
});

describe("isInvitedPartnerBeforeAnswering", () => {
  const game = {
    creator_id: "creator",
    partner_interviewed_email: "Ana@Example.com",
    status: "ready_to_play",
  };

  it("matches the invited partner regardless of email case", () => {
    expect(isInvitedPartnerBeforeAnswering(game, "partner", "ana@example.com")).toBe(true);
  });

  it("excludes the creator", () => {
    expect(isInvitedPartnerBeforeAnswering(game, "creator", "ana@example.com")).toBe(false);
  });

  it("only counts the invite before the partner has answered", () => {
    expect(
      isInvitedPartnerBeforeAnswering({ ...game, status: "answered" }, "partner", "ana@example.com"),
    ).toBe(false);
    expect(
      isInvitedPartnerBeforeAnswering({ ...game, status: "in_creation" }, "partner", "ana@example.com"),
    ).toBe(false);
  });
});

describe("exactEmailPattern", () => {
  it("normalises and escapes LIKE wildcards so they match literally", () => {
    expect(exactEmailPattern(" Ana_Silva@Example.com ")).toBe("ana\\_silva@example.com");
    expect(exactEmailPattern("100%@x.com")).toBe("100\\%@x.com");
    expect(exactEmailPattern("a\\b@x.com")).toBe("a\\\\b@x.com");
  });

  it("refuses addresses PostgREST cannot match exactly", () => {
    expect(exactEmailPattern("a*b@x.com")).toBeNull();
    expect(exactEmailPattern("")).toBeNull();
    expect(exactEmailPattern(null)).toBeNull();
  });
});
