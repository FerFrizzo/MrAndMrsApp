type Listener = (state: unknown) => void;

const listeners = new Set<Listener>();

export function emitNavigationState(state: unknown): void {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch {
      // A tracking listener must never break navigation.
    }
  });
}

export function subscribeNavigationState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetNavigationBridgeForTests(): void {
  listeners.clear();
}
