import { RefreshSessionUseCase } from "@/application/auth/RefreshSessionUseCase";
import type { IAuthRepository, RegisterInput, RegisterOutput, LoginInput, RefreshTokens } from "@/application/ports/IAuthRepository";
import type { ISessionManager } from "@/application/ports/ISessionManager";
import type { AuthSession } from "@/application/auth/AuthSession";

// Subject to human review — application use case test

const SESSION: AuthSession = {
  userId: "u1", username: "alice", role: "USER", accessToken: "old-access", refreshToken: "old-refresh",
};

class FakeSessionManager implements ISessionManager {
  saved: AuthSession | null = null;
  constructor(private session: AuthSession | null) {}
  async save(s: AuthSession): Promise<void> { this.saved = s; this.session = s; }
  async get(): Promise<AuthSession | null> { return this.session; }
  async clear(): Promise<void> { this.session = null; }
}

class FakeAuthRepository implements IAuthRepository {
  readonly refreshCalls: string[] = [];
  result: RefreshTokens | Error = { accessToken: "new-access", refreshToken: "new-refresh" };
  async register(_i: RegisterInput): Promise<RegisterOutput> { return { userId: "u1" }; }
  async login(_i: LoginInput): Promise<AuthSession> { return SESSION; }
  async refresh(token: string): Promise<RefreshTokens> {
    this.refreshCalls.push(token);
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
  async logout(): Promise<void> {}
}

describe("RefreshSessionUseCase", () => {
  it("should_rotate_the_session_and_return_the_new_access_token", async () => {
    const sm = new FakeSessionManager({ ...SESSION });
    const repo = new FakeAuthRepository();

    const result = await new RefreshSessionUseCase(repo, sm).execute();

    expect(result).toBe("new-access");
    expect(repo.refreshCalls).toEqual(["old-refresh"]);
    expect(sm.saved).toEqual({
      userId: "u1", username: "alice", role: "USER", accessToken: "new-access", refreshToken: "new-refresh",
    });
  });

  it("should_return_null_without_calling_the_backend_when_there_is_no_session", async () => {
    const repo = new FakeAuthRepository();

    const result = await new RefreshSessionUseCase(repo, new FakeSessionManager(null)).execute();

    expect(result).toBeNull();
    expect(repo.refreshCalls).toEqual([]);
  });

  it("should_return_null_without_calling_the_backend_when_the_session_has_no_refresh_token", async () => {
    const repo = new FakeAuthRepository();
    const sm = new FakeSessionManager({ ...SESSION, refreshToken: "" });

    const result = await new RefreshSessionUseCase(repo, sm).execute();

    expect(result).toBeNull();
    expect(repo.refreshCalls).toEqual([]);
  });

  it("should_return_null_and_leave_the_session_unchanged_when_the_refresh_fails", async () => {
    const sm = new FakeSessionManager({ ...SESSION });
    const repo = new FakeAuthRepository();
    repo.result = new Error("refresh token revoked");

    const result = await new RefreshSessionUseCase(repo, sm).execute();

    expect(result).toBeNull();
    expect(sm.saved).toBeNull();
  });
});
