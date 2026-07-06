import type { AuthSession } from "@/application/auth/AuthSession";
import { GetCurrentSessionUseCase } from "@/application/auth/GetCurrentSessionUseCase";
import { LoginUseCase } from "@/application/auth/LoginUseCase";
import { LogoutUseCase } from "@/application/auth/LogoutUseCase";
import { RegisterUseCase } from "@/application/auth/RegisterUseCase";
import type { IAuthRepository, LoginInput, RegisterInput, RegisterOutput, RefreshTokens } from "@/application/ports/IAuthRepository";
import type { ISessionManager } from "@/application/ports/ISessionManager";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import { AuthViewModel } from "@/presentation/view-models/AuthViewModel";

// Subject to human review — presentation ViewModel test

const session: AuthSession = { userId: "u1", username: "alice", role: "USER", accessToken: "tok-123", refreshToken: "ref-123" };

class FakeSessionManager implements ISessionManager {
  saved: AuthSession | null = null;
  async save(value: AuthSession): Promise<void> {
    this.saved = value;
  }
  async get(): Promise<AuthSession | null> {
    return this.saved;
  }
  async clear(): Promise<void> {
    this.saved = null;
  }
}

class OkAuthRepository implements IAuthRepository {
  async register(_input: RegisterInput): Promise<RegisterOutput> {
    return { userId: "u1" };
  }
  async login(_input: LoginInput): Promise<AuthSession> {
    return session;
  }
  async refresh(_token: string): Promise<RefreshTokens> {
    return { accessToken: "tok-123", refreshToken: "ref-123" };
  }
  async logout(_token: string): Promise<void> {}
}

class FailingAuthRepository implements IAuthRepository {
  async register(_input: RegisterInput): Promise<RegisterOutput> {
    throw new Error("conflict");
  }
  async login(_input: LoginInput): Promise<AuthSession> {
    throw new Error("bad credentials");
  }
  async refresh(_token: string): Promise<RefreshTokens> {
    throw new Error("refresh failed");
  }
  async logout(_token: string): Promise<void> {}
}

function build(
  repository: IAuthRepository,
  sessionManager: FakeSessionManager = new FakeSessionManager()
): { viewModel: AuthViewModel; sessionManager: FakeSessionManager } {
  const viewModel = new AuthViewModel(
    new LoginUseCase(repository, sessionManager),
    new RegisterUseCase(repository),
    new LogoutUseCase(sessionManager, repository),
    new GetCurrentSessionUseCase(sessionManager)
  );
  return { viewModel, sessionManager };
}

describe("AuthViewModel", () => {
  it("should_persist_session_on_successful_login", async () => {
    const { viewModel, sessionManager } = build(new OkAuthRepository());

    await viewModel.login("alice@example.com", "secret");

    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
    expect(viewModel.getState().session?.username).toBe("alice");
    expect(sessionManager.saved?.accessToken).toBe("tok-123");
  });

  it("should_surface_an_error_and_save_nothing_on_failed_login", async () => {
    const { viewModel, sessionManager } = build(new FailingAuthRepository());

    await viewModel.login("alice@example.com", "wrong");

    expect(viewModel.getState().status).toBe(AsyncStatus.Error);
    expect(viewModel.getState().session).toBeNull();
    expect(viewModel.getState().errorKey).toBe("auth.errorLogin");
    expect(sessionManager.saved).toBeNull();
  });

  it("should_register_then_log_in", async () => {
    const { viewModel } = build(new OkAuthRepository());

    await viewModel.register("alice@example.com", "alice", "secret");

    expect(viewModel.getState().session?.username).toBe("alice");
  });

  it("should_clear_the_session_on_logout", async () => {
    const sessionManager = new FakeSessionManager();
    sessionManager.saved = session;
    const { viewModel } = build(new OkAuthRepository(), sessionManager);

    await viewModel.loadSession();
    expect(viewModel.getState().session).not.toBeNull();

    await viewModel.logout();

    expect(viewModel.getState().session).toBeNull();
    expect(sessionManager.saved).toBeNull();
  });

  // Form field intents
  it("should_update_email_in_state_when_setEmail_is_called", () => {
    const { viewModel } = build(new OkAuthRepository());
    viewModel.setEmail("user@example.com");
    expect(viewModel.getState().email).toBe("user@example.com");
  });

  it("should_update_username_in_state_when_setUsername_is_called", () => {
    const { viewModel } = build(new OkAuthRepository());
    viewModel.setUsername("alice");
    expect(viewModel.getState().username).toBe("alice");
  });

  it("should_update_password_in_state_when_setPassword_is_called", () => {
    const { viewModel } = build(new OkAuthRepository());
    viewModel.setPassword("secret");
    expect(viewModel.getState().password).toBe("secret");
  });

  it("should_toggle_mode_to_register_and_back", () => {
    const { viewModel } = build(new OkAuthRepository());
    expect(viewModel.getState().mode).toBe("login");
    expect(viewModel.getState().isRegister).toBe(false);

    viewModel.toggleMode();
    expect(viewModel.getState().mode).toBe("register");
    expect(viewModel.getState().isRegister).toBe(true);

    viewModel.toggleMode();
    expect(viewModel.getState().mode).toBe("login");
    expect(viewModel.getState().isRegister).toBe(false);
  });

  it("should_toggle_clears_error_key", () => {
    const { viewModel } = build(new FailingAuthRepository());
    viewModel.toggleMode();
    expect(viewModel.getState().errorKey).toBeNull();
  });

  it("should_submit_calls_login_when_mode_is_login", async () => {
    const { viewModel } = build(new OkAuthRepository());
    viewModel.setEmail("alice@example.com");
    viewModel.setPassword("secret");

    await viewModel.submit();

    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
    expect(viewModel.getState().session?.username).toBe("alice");
  });

  it("should_submit_calls_register_when_mode_is_register", async () => {
    const { viewModel } = build(new OkAuthRepository());
    viewModel.toggleMode();
    viewModel.setEmail("alice@example.com");
    viewModel.setUsername("alice");
    viewModel.setPassword("secret");

    await viewModel.submit();

    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
  });

  it("should_start_in_login_mode_with_empty_fields", () => {
    const { viewModel } = build(new OkAuthRepository());
    const state = viewModel.getState();
    expect(state.mode).toBe("login");
    expect(state.email).toBe("");
    expect(state.username).toBe("");
    expect(state.password).toBe("");
    expect(state.isRegister).toBe(false);
  });
});
