import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

// React Navigation screen *names* only. Params (gameId and the rest) are never
// copied into the route string. Group segments like "(tabs)" are dropped, and
// anything that looks like an id or an email is dropped too.

const GROUP = /^\(.*\)$/;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export interface AnalyticsRoute {
  name?: string;
  state?: AnalyticsRouteState;
  params?: object;
}

export interface AnalyticsRouteState {
  index?: number;
  routes?: AnalyticsRoute[];
}

export function normaliseRoute(segments: readonly string[]): string {
  const visible = segments.filter(isSafeSegment);
  return visible.length === 0 ? "/" : `/${visible.join("/")}`;
}

function isSafeSegment(segment: string): boolean {
  if (!segment || GROUP.test(segment)) return false;
  if (segment.includes("@") || segment.includes("?") || segment.includes("=")) return false;
  if (UUID.test(segment)) return false;
  return /^[A-Za-z0-9_\-[\]]+$/.test(segment);
}

function asState(value: unknown): AnalyticsRouteState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const routes = (value as AnalyticsRouteState).routes;
  if (!Array.isArray(routes)) return undefined;
  return value as AnalyticsRouteState;
}

export function routeNamesFromState(state: unknown): string[] {
  const nav = asState(state);
  if (!nav?.routes?.length) return [];
  const index = typeof nav.index === "number" ? nav.index : 0;
  const route = nav.routes[index];
  if (!route || typeof route.name !== "string") return [];

  const names = [route.name];
  if (route.state && asState(route.state)?.routes?.length) {
    return names.concat(routeNamesFromState(route.state));
  }

  let focused: string | undefined;
  try {
    focused = getFocusedRouteNameFromRoute(route as never);
  } catch {
    focused = undefined;
  }
  if (focused && focused !== route.name) names.push(focused);
  return names;
}

export function routeFromNavigationState(state: unknown): string {
  try {
    return normaliseRoute(routeNamesFromState(state));
  } catch {
    return "/";
  }
}
