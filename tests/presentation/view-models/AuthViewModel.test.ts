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
});
