import { LogoutUseCase } from "@/application/auth/LogoutUseCase";
import type { IAuthRepository, RegisterInput, RegisterOutput, LoginInput, RefreshTokens } from "@/application/ports/IAuthRepository";
import type { ISessionManager } from "@/application/ports/ISessionManager";
import type { AuthSession } from "@/application/auth/AuthSession";

// Subject to human review — application use case test

const SESSION: AuthSession = {
  userId: "u1", username: "alice", role: "USER", accessToken: "a", refreshToken: "old-refresh",
};

class FakeSessionManager implements ISessionManager {
  cleared = false;
  constructor(private session: AuthSession | null) {}
  async save(): Promise<void> {}
  async get(): Promise<AuthSession | null> { return this.session; }
  async clear(): Promise<void> { this.cleared = true; this.session = null; }
}

class FakeAuthRepository implements IAuthRepository {
  readonly logoutCalls: string[] = [];
  logoutError: Error | null = null;
  async register(_i: RegisterInput): Promise<RegisterOutput> { return { userId: "u1" }; }
  async login(_i: LoginInput): Promise<AuthSession> { return SESSION; }
  async refresh(_t: string): Promise<RefreshTokens> { return { accessToken: "x", refreshToken: "y" }; }
  async logout(token: string): Promise<void> {
    this.logoutCalls.push(token);
    if (this.logoutError) throw this.logoutError;
  }
}

describe("LogoutUseCase", () => {
  it("should_revoke_the_refresh_token_on_the_backend_then_clear_the_session", async () => {
    const sm = new FakeSessionManager({ ...SESSION });
    const repo = new FakeAuthRepository();

    await new LogoutUseCase(sm, repo).execute();

    expect(repo.logoutCalls).toEqual(["old-refresh"]);
    expect(sm.cleared).toBe(true);
  });

  it("should_clear_the_session_even_when_the_backend_logout_fails", async () => {
    const sm = new FakeSessionManager({ ...SESSION });
    const repo = new FakeAuthRepository();
    repo.logoutError = new Error("network down");

    await new LogoutUseCase(sm, repo).execute();

    expect(sm.cleared).toBe(true);
  });

  it("should_just_clear_the_session_when_there_is_no_session", async () => {
    const sm = new FakeSessionManager(null);
    const repo = new FakeAuthRepository();

    await new LogoutUseCase(sm, repo).execute();

    expect(repo.logoutCalls).toEqual([]);
    expect(sm.cleared).toBe(true);
  });

  it("should_just_clear_the_session_when_it_has_no_refresh_token", async () => {
    const sm = new FakeSessionManager({ ...SESSION, refreshToken: "" });
    const repo = new FakeAuthRepository();

    await new LogoutUseCase(sm, repo).execute();

    expect(repo.logoutCalls).toEqual([]);
    expect(sm.cleared).toBe(true);
  });
});
