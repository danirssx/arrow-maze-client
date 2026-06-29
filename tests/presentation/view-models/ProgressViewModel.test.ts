import type { ProgressFacade } from "@/application/facades/ProgressFacade";
import type { LocalProgress } from "@/application/ports/IProgressRepository";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import { ProgressViewModel } from "@/presentation/view-models/ProgressViewModel";

// Subject to human review — presentation ViewModel test

function progressWith(levelCount: number): LocalProgress {
  return {
    progressId: "p-1",
    userId: "user-1",
    version: 1,
    updatedAt: "2026-01-01T00:00:00Z",
    pendingSync: false,
    completedLevels: Array.from({ length: levelCount }).map((_, index) => ({
      levelId: `550e8400-e29b-41d4-a716-44665544001${index}`,
      score: 100,
      timeSeconds: 10,
      movesCount: 3,
      completedAt: "2026-01-01T00:00:00Z"
    }))
  };
}

function facadeReturning(value: LocalProgress | Error): ProgressFacade {
  return {
    load: jest.fn(() => (value instanceof Error ? Promise.reject(value) : Promise.resolve(value)))
  } as unknown as ProgressFacade;
}

describe("ProgressViewModel", () => {
  it("should_expose_loaded_when_levels_completed", async () => {
    const viewModel = new ProgressViewModel(facadeReturning(progressWith(2)));

    await viewModel.load("user-1", "token");

    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
    expect(viewModel.getState().data?.completedLevels).toHaveLength(2);
  });

  it("should_expose_empty_when_no_levels_completed", async () => {
    const viewModel = new ProgressViewModel(facadeReturning(progressWith(0)));

    await viewModel.load("user-1", "token");

    expect(viewModel.getState().status).toBe(AsyncStatus.Empty);
  });

  it("should_expose_error_when_facade_fails", async () => {
    const viewModel = new ProgressViewModel(facadeReturning(new Error("storage")));

    await viewModel.load("user-1", "token");

    expect(viewModel.getState().status).toBe(AsyncStatus.Error);
  });
});
