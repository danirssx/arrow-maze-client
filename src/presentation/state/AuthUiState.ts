import type { AuthSession } from "@/application/auth/AuthSession";
import { AsyncStatus } from "./AsyncUiState";

export type AuthMode = "login" | "register";

/**
 * MVVM UI state for the auth screen.
 *
 * `status` reuses the async phases (Idle = ready/logged out, Loading,
 * Loaded = logged in, Error). `session` holds the current `AuthSession` when
 * authenticated; `errorKey` is the i18n key for a controlled error message.
 * Form fields (mode/email/username/password) live here so the screen has
 * no local useState — all form state flows through the ViewModel.
 */
export type AuthUiState = {
  readonly status: AsyncStatus;
  readonly session: AuthSession | null;
  readonly errorKey: string | null;
  readonly mode: AuthMode;
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly isRegister: boolean;
};

export const initialAuthUiState: AuthUiState = {
  status: AsyncStatus.Idle,
  session: null,
  errorKey: null,
  mode: "login",
  email: "",
  username: "",
  password: "",
  isRegister: false,
};
