import type { LeaderboardFacade } from "@/application/facades/LeaderboardFacade";
import type { Leaderboard } from "@/application/ports/ILeaderboardRepository";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import { LeaderboardViewModel } from "@/presentation/view-models/LeaderboardViewModel";

// Subject to human review — presentation ViewModel test

function leaderboardWith(entryCount: number): Leaderboard {
  return {
    leaderboardId: "lb-1",
    levelId: "manual-001-first-turn",
    updatedAt: "2026-01-01T00:00:00Z",
    entries: Array.from({ length: entryCount }).map((_, index) => ({
      entryId: `entry-${index}`,
      userId: `user-${index}`,
      usernameSnapshot: `player${index}`,
      score: 100 - index,
      timeSeconds: 12,
      movesCount: 3,
      rank: index + 1,
      submittedAt: "2026-01-01T00:00:00Z"
    }))
  };
}

function facadeReturning(value: Leaderboard | Error): LeaderboardFacade {
  return {
    getTopScores: jest.fn(() => (value instanceof Error ? Promise.reject(value) : Promise.resolve(value))),
    submitScore: jest.fn()
  } as unknown as LeaderboardFacade;
}

describe("LeaderboardViewModel", () => {
  it("should_expose_loaded_when_entries_exist", async () => {
    const viewModel = new LeaderboardViewModel(facadeReturning(leaderboardWith(3)));

    await viewModel.load("manual-001-first-turn");

    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
    expect(viewModel.getState().data?.entries).toHaveLength(3);
  });

  it("should_expose_empty_when_no_entries", async () => {
    const viewModel = new LeaderboardViewModel(facadeReturning(leaderboardWith(0)));

    await viewModel.load("manual-001-first-turn");

    expect(viewModel.getState().status).toBe(AsyncStatus.Empty);
  });

  it("should_expose_error_when_facade_fails", async () => {
    const viewModel = new LeaderboardViewModel(facadeReturning(new Error("network")));

    await viewModel.load("manual-001-first-turn");

    expect(viewModel.getState().status).toBe(AsyncStatus.Error);
  });
});
