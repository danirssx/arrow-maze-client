import type { DailyChallengeFacade } from "@/application/facades/DailyChallengeFacade";
import type { DailyChallenge } from "@/application/ports/IDailyChallengeRepository";
import { LevelKind } from "@/application/level-build/LevelDefinition";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import { DailyChallengeViewModel } from "@/presentation/view-models/DailyChallengeViewModel";

// Subject to human review — presentation ViewModel test

function challengeWith(overrides: Partial<DailyChallenge["meta"]> = {}): DailyChallenge {
  return {
    definition: {
      id: "daily-2026-07-10",
      difficulty: "EASY",
      arrows: [],
      attempts: 5,
      kind: LevelKind.Normal,
    },
    meta: { date: "2026-07-10", difficulty: "EASY", source: "gemini", fallbackUsed: false, ...overrides },
  };
}

function facadeReturning(value: DailyChallenge): { facade: DailyChallengeFacade; getDailyChallenge: jest.Mock } {
  const getDailyChallenge = jest.fn(() => Promise.resolve(value));
  const facade = { getDailyChallenge } as unknown as DailyChallengeFacade;
  return { facade, getDailyChallenge };
}

function facadeRejecting(error: unknown): DailyChallengeFacade {
  return { getDailyChallenge: jest.fn(() => Promise.reject(error)) } as unknown as DailyChallengeFacade;
}

describe("DailyChallengeViewModel", () => {
  it("should_move_through_loading_to_loaded_on_success", async () => {
    const challenge = challengeWith();
    const { facade, getDailyChallenge } = facadeReturning(challenge);
    const viewModel = new DailyChallengeViewModel(facade);

    const states: string[] = [];
    viewModel.subscribe(() => states.push(viewModel.getState().status));

    await viewModel.load();

    expect(getDailyChallenge).toHaveBeenCalledTimes(1);
    expect(states).toContain(AsyncStatus.Loading);
    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
    expect(viewModel.getState().data).toBe(challenge);
  });

  it("should_expose_error_when_backend_is_unavailable", async () => {
    const viewModel = new DailyChallengeViewModel(facadeRejecting(new Error("503")));

    await viewModel.load();

    expect(viewModel.getState().status).toBe(AsyncStatus.Error);
    expect(viewModel.getState().data).toBeNull();
  });

  it("should_load_a_fallback_sourced_challenge_as_playable", async () => {
    const { facade } = facadeReturning(challengeWith({ source: "fallback", fallbackUsed: true }));
    const viewModel = new DailyChallengeViewModel(facade);

    await viewModel.load();

    expect(viewModel.getState().status).toBe(AsyncStatus.Loaded);
    expect(viewModel.getState().data?.meta.fallbackUsed).toBe(true);
  });
});
