import { PAYWALL_SOURCES, parsePaywallSource } from "./paywallSource";

describe("parsePaywallSource", () => {
  it.each(PAYWALL_SOURCES)("accepts %s", (source) => {
    expect(parsePaywallSource(source)).toBe(source);
  });
  it("maps a missing value to unknown", () => {
    expect(parsePaywallSource(undefined)).toBe("unknown");
    expect(parsePaywallSource("")).toBe("unknown");
  });
  it("maps garbage to unknown", () => {
    expect(parsePaywallSource("hacked<script>")).toBe("unknown");
    expect(parsePaywallSource("CREATE_GAME")).toBe("unknown");
  });
  it("maps an array value to unknown", () => {
    expect(parsePaywallSource(["account", "create_game"])).toBe("unknown");
  });
});
