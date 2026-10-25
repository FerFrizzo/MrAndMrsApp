import { gameCreatedProps, parseQuestionPackageId, questionCountBucket } from "./buckets";

describe("questionCountBucket", () => {
  it("buckets without keeping the exact count", () => {
    expect(questionCountBucket(1)).toBe("1-5");
    expect(questionCountBucket(5)).toBe("1-5");
    expect(questionCountBucket(6)).toBe("6-10");
    expect(questionCountBucket(10)).toBe("6-10");
    expect(questionCountBucket(11)).toBe("11+");
    expect(questionCountBucket(40)).toBe("11+");
  });
  it("refuses an empty or invalid count", () => {
    expect(questionCountBucket(0)).toBeNull();
    expect(questionCountBucket(-1)).toBeNull();
    expect(questionCountBucket(Number.NaN)).toBeNull();
  });
});

describe("parseQuestionPackageId", () => {
  it("accepts known packages", () => {
    expect(parseQuestionPackageId("wedding")).toBe("wedding");
  });
  it("rejects unknown ids", () => {
    expect(parseQuestionPackageId("custom")).toBeNull();
    expect(parseQuestionPackageId("user@example.com")).toBeNull();
    expect(gameCreatedProps(null)).toEqual({ from_package: false });
    expect(gameCreatedProps("deep")).toEqual({ from_package: true, package_id: "deep" });
  });
});
