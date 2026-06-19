import type { AuthSession } from "@/application/auth/AuthSession";
import { AsyncStatus } from "./AsyncUiState";

/**
 * MVVM UI state for the auth screen.
 *
 * `status` reuses the async phases (Idle = ready/logged out, Loading,
 * Loaded = logged in, Error). `session` holds the current `AuthSession` when
 * authenticated; `errorKey` is the i18n key for a controlled error message.
 */
export type AuthUiState = {
  readonly status: AsyncStatus;
  readonly session: AuthSession | null;
  readonly errorKey: string | null;
};

export const initialAuthUiState: AuthUiState = {
  status: AsyncStatus.Idle,
  session: null,
  errorKey: null
};
