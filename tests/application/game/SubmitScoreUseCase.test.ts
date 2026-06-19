import { GetCurrentSessionUseCase } from "@/application/auth/GetCurrentSessionUseCase";
import type { AuthSession } from "@/application/auth/AuthSession";
import { LeaderboardFacade } from "@/application/facades/LeaderboardFacade";
import type {
  ILeaderboardRepository,
  Leaderboard,
  SubmitScoreInput
} from "@/application/ports/ILeaderboardRepository";
import type { ISessionManager } from "@/application/ports/ISessionManager";
import { SubmitScoreUseCase } from "@/application/use-cases/game/SubmitScoreUseCase";

class FakeSessionManager implements ISessionManager {
  constructor(private readonly session: AuthSession | null) {}
  async save(): Promise<void> {}
  async get(): Promise<AuthSession | null> {
    return this.session;
  }
  async clear(): Promise<void> {}
}

class FakeLeaderboardRepository implements ILeaderboardRepository {
  readonly submitted: { input: SubmitScoreInput; token: string }[] = [];
  async getTopScores(levelId: string): Promise<Leaderboard> {
    return { leaderboardId: "lb", levelId, updatedAt: "", entries: [] };
  }
  async submitScore(input: SubmitScoreInput, accessToken: string): Promise<void> {
    this.submitted.push({ input, token: accessToken });
  }
}

const session: AuthSession = { userId: "u1", username: "alice", role: "USER", accessToken: "tok-123" };

function build(sessionValue: AuthSession | null): { useCase: SubmitScoreUseCase; repo: FakeLeaderboardRepository } {
  const repo = new FakeLeaderboardRepository();
  const useCase = new SubmitScoreUseCase(
    new GetCurrentSessionUseCase(new FakeSessionManager(sessionValue)),
    new LeaderboardFacade(repo)
  );
  return { useCase, repo };
}

describe("SubmitScoreUseCase", () => {
  it("should_submit_a_scored_run_when_authenticated", async () => {
    const { useCase, repo } = build(session);

    const result = await useCase.execute({ levelId: "manual-001", elapsedMs: 30_000, arrowCount: 5 });

    expect(result.submitted).toBe(true);
    expect(repo.submitted).toHaveLength(1);
    const submission = repo.submitted[0]!;
    expect(submission.token).toBe("tok-123");
    expect(submission.input.levelId).toBe("manual-001");
    expect(submission.input.usernameSnapshot).toBe("alice");
    expect(submission.input.movesCount).toBe(5);
    expect(submission.input.timeSeconds).toBe(30);
    expect(submission.input.score).toBe(700); // default TimeScoringStrategy: 1000 - 30*10
    expect(submission.input.leaderboardId.length).toBeGreaterThan(0);
    expect(submission.input.entryId.length).toBeGreaterThan(0);
  });

  it("should_skip_submission_when_unauthenticated", async () => {
    const { useCase, repo } = build(null);

    const result = await useCase.execute({ levelId: "x", elapsedMs: 1_000, arrowCount: 2 });

    expect(result.submitted).toBe(false);
    expect(repo.submitted).toHaveLength(0);
  });

  it("should_clamp_time_and_moves_to_the_backend_minimums", async () => {
    const { useCase, repo } = build(session);

    await useCase.execute({ levelId: "x", elapsedMs: 0, arrowCount: 0 });

    const submission = repo.submitted[0]!;
    expect(submission.input.timeSeconds).toBeGreaterThan(0);
    expect(submission.input.movesCount).toBeGreaterThan(0);
  });
});
