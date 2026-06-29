import NetInfo from "@react-native-community/netinfo";
import { useEffect, useMemo } from "react";
import { AppState } from "react-native";

import { useAuthSession } from "@/framework/auth/AuthGate";
import { createProgressFacade } from "@/framework/config/progress";
import { startProgressSync } from "@/framework/progress/startProgressSync";

export function useProgressSync(): void {
  const { session } = useAuthSession();
  const progressFacade = useMemo(() => createProgressFacade(), []);

  useEffect(() => {
    if (session === null) return undefined;

    return startProgressSync(
      () => progressFacade.drainPendingProgress(session.userId, session.accessToken)
        .catch((error: unknown) => {
          console.warn("Failed to drain pending progress", error);
          return false;
        }),
      {
        subscribeForeground: (listener) => {
          const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") listener();
          });
          return () => subscription.remove();
        },
        subscribeReconnect: (listener) => NetInfo.addEventListener((state) => {
          if (state.isConnected === true) listener();
        }),
      },
    );
  }, [progressFacade, session]);
}
