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
 * The only presentation object that drives login/register/logout. Form fields
 * (mode, email, username, password) live in the state so the screen has no
 * local useState. Intents (setEmail, setUsername, setPassword, toggleMode,
 * submit) are dispatched from the view; the ViewModel updates state reactively.
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
    this.setState({ ...this.getState(), status: session === null ? AsyncStatus.Idle : AsyncStatus.Loaded, session, errorKey: null });
  }

  setEmail(email: string): void {
    this.setState({ ...this.getState(), email });
  }

  setUsername(username: string): void {
    this.setState({ ...this.getState(), username });
  }

  setPassword(password: string): void {
    this.setState({ ...this.getState(), password });
  }

  toggleMode(): void {
    const next = this.getState().mode === "login" ? "register" : "login";
    this.setState({ ...this.getState(), mode: next, isRegister: next === "register", errorKey: null });
  }

  async submit(): Promise<void> {
    const { mode, email, username, password } = this.getState();
    if (mode === "login") {
      await this.login(email.trim(), password);
    } else {
      await this.register(email.trim(), username.trim(), password);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.setState({ ...this.getState(), status: AsyncStatus.Loading, errorKey: null });
    try {
      const session = await this.loginUseCase.execute({ email, rawPassword: password });
      this.setState({ ...this.getState(), status: AsyncStatus.Loaded, session, errorKey: null });
    } catch {
      this.setState({ ...this.getState(), status: AsyncStatus.Error, session: null, errorKey: "auth.errorLogin" });
    }
  }

  async register(email: string, username: string, password: string): Promise<void> {
    this.setState({ ...this.getState(), status: AsyncStatus.Loading, errorKey: null });
    try {
      await this.registerUseCase.execute({ email, username, rawPassword: password });
      const session = await this.loginUseCase.execute({ email, rawPassword: password });
      this.setState({ ...this.getState(), status: AsyncStatus.Loaded, session, errorKey: null });
    } catch {
      this.setState({ ...this.getState(), status: AsyncStatus.Error, session: null, errorKey: "auth.errorRegister" });
    }
  }

  async logout(): Promise<void> {
    await this.logoutUseCase.execute();
    this.setState({ ...this.getState(), status: AsyncStatus.Idle, session: null, errorKey: null });
  }
}
