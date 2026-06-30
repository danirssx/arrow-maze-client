import type { LeaderboardFacade } from "@/application/facades/LeaderboardFacade";
import type { Leaderboard } from "@/application/ports/ILeaderboardRepository";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import { LeaderboardViewModel } from "@/presentation/view-models/LeaderboardViewModel";

// Subject to human review — presentation ViewModel test

const LEVEL_UUID = "550e8400-e29b-41d4-a716-446655440010";

function leaderboardWith(entryCount: number): Leaderboard {
  return {
    leaderboardId: "lb-1",
    levelId: LEVEL_UUID,
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

function facadeReturning(value: Leaderboard): { facade: LeaderboardFacade; getTopScores: jest.Mock } {
  const getTopScores = jest.fn(() => Promise.resolve(value));
  const facade = { getTopScores, submitScore: jest.fn() } as unknown as LeaderboardFacade;
  return { facade, getTopScores };
}

function facadeRejecting(error: unknown): { facade: LeaderboardFacade; getTopScores: jest.Mock } {
  const getTopScores = jest.fn(() => Promise.reject(error));
  const facade = { getTopScores, submitScore: jest.fn() } as unknown as LeaderboardFacade;
  return { facade, getTopScores };
}

describe("LeaderboardViewModel", () => {
  it("should_expose_loaded_when_entries_exist", async () => {
    const { facade, getTopScores } = facadeReturning(leaderboardWith(3));
    const viewModel = new LeaderboardViewModel(facade);

    await viewModel.load(LEVEL_UUID);

    expect(getTopScores).toHaveBeenCalledWith(LEVEL_UUID);
    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
    expect(viewModel.getState().data?.entries).toHaveLength(3);
  });

  it("should_expose_empty_when_no_entries", async () => {
    const { facade } = facadeReturning(leaderboardWith(0));
    const viewModel = new LeaderboardViewModel(facade);

    await viewModel.load(LEVEL_UUID);

    expect(viewModel.getState().status).toBe(AsyncStatus.Empty);
  });

  it("should_expose_error_when_facade_fails", async () => {
    const { facade } = facadeRejecting(new Error("network"));
    const viewModel = new LeaderboardViewModel(facade);

    await viewModel.load(LEVEL_UUID);

    expect(viewModel.getState().status).toBe(AsyncStatus.Error);
  });

  it("should_expose_empty_when_backend_reports_missing_leaderboard", async () => {
    const { facade } = facadeRejecting({ code: "NOT_FOUND" });
    const viewModel = new LeaderboardViewModel(facade);

    await viewModel.load(LEVEL_UUID);

    expect(viewModel.getState().status).toBe(AsyncStatus.Empty);
    expect(viewModel.getState().data).toEqual({ levelId: LEVEL_UUID, entries: [] });
  });

  it("should_expose_empty_without_requesting_when_level_id_is_not_a_uuid", async () => {
    const { facade, getTopScores } = facadeReturning(leaderboardWith(3));
    const viewModel = new LeaderboardViewModel(facade);

    await viewModel.load("manual-001-first-turn");

    expect(getTopScores).not.toHaveBeenCalled();
    expect(viewModel.getState().status).toBe(AsyncStatus.Empty);
  });
});
