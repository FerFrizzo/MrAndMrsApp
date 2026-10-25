import { normaliseRoute, routeFromNavigationState } from "./route";

jest.mock("@react-navigation/native", () => ({
  getFocusedRouteNameFromRoute: (route: {
    name?: string;
    state?: { index?: number; routes: { name: string; state?: unknown }[] };
    params?: { screen?: string };
  }) => {
    const state = route.state;
    if (state?.routes?.length) {
      const child = state.routes[state.index ?? 0];
      return child?.name;
    }
    return route.params?.screen;
  },
}));

describe("normaliseRoute", () => {
  it("drops route groups", () => {
    expect(normaliseRoute(["(tabs)", "Dashboard"])).toBe("/Dashboard");
  });
  it("keeps dynamic segments as templates", () => {
    expect(normaliseRoute(["games", "[id]"])).toBe("/games/[id]");
  });
  it("maps the root to /", () => {
    expect(normaliseRoute([])).toBe("/");
    expect(normaliseRoute(["(tabs)"])).toBe("/");
  });
  it("drops emails and uuids", () => {
    expect(normaliseRoute(["GameDetails", "user@example.com"])).toBe("/GameDetails");
    expect(
      normaliseRoute(["GameDetails", "11111111-1111-4111-8111-111111111111"]),
    ).toBe("/GameDetails");
  });
});

describe("routeFromNavigationState", () => {
  it("joins focused screen names and ignores params", () => {
    const route = routeFromNavigationState({
      index: 0,
      routes: [
        {
          name: "Main",
          params: { gameId: "11111111-1111-4111-8111-111111111111" },
          state: {
            index: 1,
            routes: [
              { name: "Dashboard" },
              { name: "GameDetails", params: { gameId: "secret-game" } },
            ],
          },
        },
      ],
    });
    expect(route).toBe("/Main/GameDetails");
    expect(route).not.toMatch(/secret|1111/);
  });

  it("uses the focused child name when only params.screen is known", () => {
    expect(
      routeFromNavigationState({
        index: 0,
        routes: [{ name: "Main", params: { screen: "Account" } }],
      }),
    ).toBe("/Main/Account");
  });

  it("returns / for empty or malformed state", () => {
    expect(routeFromNavigationState(undefined)).toBe("/");
    expect(routeFromNavigationState({ index: 0 })).toBe("/");
  });
});
