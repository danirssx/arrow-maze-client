// Pattern: Observer
//
// A process-wide channel the HTTP layer uses to signal that the current session
// is no longer valid (e.g. a 401 on an authed request). The AuthGate subscribes
// and reacts by clearing the session and redirecting to login. Keeping this a
// pure, dependency-free module lets infrastructure signal invalidation without
// importing the session/storage layer or navigation.

type SessionInvalidationListener = () => void;

const listeners = new Set<SessionInvalidationListener>();

/** Subscribe to session-invalidation events. Returns an unsubscribe function. */
export function onSessionInvalidated(listener: SessionInvalidationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify every subscriber that the current session must be invalidated. */
export function notifySessionInvalidated(): void {
  for (const listener of [...listeners]) {
    listener();
  }
}
