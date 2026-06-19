import { useEffect, useState } from "react";
import type { AuthSession } from "@/application/auth/AuthSession";
import { getCurrentSession } from "@/framework/config/session";

export type CurrentSessionState = {
  readonly loading: boolean;
  readonly session: AuthSession | null;
};

export function useCurrentSession(): CurrentSessionState {
  const [state, setState] = useState<CurrentSessionState>({ loading: true, session: null });

  useEffect(() => {
    let active = true;
    void getCurrentSession()
      .then((session) => {
        if (active) setState({ loading: false, session });
      })
      .catch(() => {
        if (active) setState({ loading: false, session: null });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
