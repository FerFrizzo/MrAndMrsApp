import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { identify, initAnalytics, reset, track } from "./index";
import { subscribeNavigationState } from "./navigationBridge";
import { routeFromNavigationState } from "./route";

// Mounted inside AuthProvider and outside the signed-in stack, so it still
// sees sign-out. Screen views use React Navigation screen names only.
export function AnalyticsInitializer() {
  const auth = useAuth();
  const uid = auth.isLoading ? null : auth.user?.id ?? null;
  const prevUid = useRef<string | null>(null);
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    void initAnalytics();
  }, []);

  useEffect(() => {
    if (uid) identify(uid);
    else if (prevUid.current) reset();
    prevUid.current = uid;
  }, [uid]);

  useEffect(() => {
    return subscribeNavigationState((state) => {
      setRoute(routeFromNavigationState(state));
    });
  }, []);

  useEffect(() => {
    if (!route) return;
    track("screen_viewed", { route });
  }, [route]);

  return null;
}
