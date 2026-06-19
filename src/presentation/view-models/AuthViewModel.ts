import type { GetCurrentSessionUseCase } from "@/application/auth/GetCurrentSessionUseCase";
import type { LoginUseCase } from "@/application/auth/LoginUseCase";
import type { LogoutUseCase } from "@/application/auth/LogoutUseCase";
import type { RegisterUseCase } from "@/application/auth/RegisterUseCase";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import { initialAuthUiState } from "@/presentation/state/AuthUiState";
import type { AuthUiState } from "@/presentation/state/AuthUiState";
import { ObservableViewModel } from "./ObservableViewModel";

/**
 * MVVM — auth ViewModel.
 *
 * The only presentation object that drives login/register/logout. Successful
 * login persists the session through `LoginUseCase` (which saves it in the
 * `SessionManager`), so authed features — including the leaderboard score
 * submission — become live. Failures surface a controlled error key; no session
 * is saved. It never touches HTTP or storage directly.
 */
export class AuthViewModel extends ObservableViewModel<AuthUiState> {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getSessionUseCase: GetCurrentSessionUseCase
  ) {
    super(initialAuthUiState);
  }

  async loadSession(): Promise<void> {
    const session = await this.getSessionUseCase.execute();
    this.setState({ status: session === null ? AsyncStatus.Idle : AsyncStatus.Loaded, session, errorKey: null });
  }

  async login(email: string, password: string): Promise<void> {
    this.setState({ ...this.getState(), status: AsyncStatus.Loading, errorKey: null });
    try {
      const session = await this.loginUseCase.execute({ email, rawPassword: password });
      this.setState({ status: AsyncStatus.Loaded, session, errorKey: null });
    } catch {
      this.setState({ status: AsyncStatus.Error, session: null, errorKey: "auth.errorLogin" });
    }
  }

  async register(email: string, username: string, password: string): Promise<void> {
    this.setState({ ...this.getState(), status: AsyncStatus.Loading, errorKey: null });
    try {
      await this.registerUseCase.execute({ email, username, rawPassword: password });
      const session = await this.loginUseCase.execute({ email, rawPassword: password });
      this.setState({ status: AsyncStatus.Loaded, session, errorKey: null });
    } catch {
      this.setState({ status: AsyncStatus.Error, session: null, errorKey: "auth.errorRegister" });
    }
  }

  async logout(): Promise<void> {
    await this.logoutUseCase.execute();
    this.setState({ status: AsyncStatus.Idle, session: null, errorKey: null });
  }
}
