import { fireEvent, waitFor } from "@testing-library/react-native";
import type { DailyChallengeFacade } from "@/application/facades/DailyChallengeFacade";
import type { DailyChallenge } from "@/application/ports/IDailyChallengeRepository";
import { LevelKind } from "@/application/level-build/LevelDefinition";
import { DailyChallengeViewModel } from "@/presentation/view-models/DailyChallengeViewModel";
import { DailyChallengeScreen } from "@/presentation/screens/DailyChallengeScreen";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const CHALLENGE: DailyChallenge = {
  definition: {
    id: "daily-2026-07-10",
    difficulty: "MEDIUM",
    arrows: [],
    attempts: 5,
    kind: LevelKind.Normal,
  },
  meta: { date: "2026-07-10", difficulty: "MEDIUM", source: "gemini", fallbackUsed: false },
};

function vmReturning(value: DailyChallenge): DailyChallengeViewModel {
  const facade = { getDailyChallenge: jest.fn(() => Promise.resolve(value)) } as unknown as DailyChallengeFacade;
  return new DailyChallengeViewModel(facade);
}

function vmRejecting(): { viewModel: DailyChallengeViewModel; getDailyChallenge: jest.Mock } {
  const getDailyChallenge = jest.fn(() => Promise.reject(new Error("503")));
  const facade = { getDailyChallenge } as unknown as DailyChallengeFacade;
  return { viewModel: new DailyChallengeViewModel(facade), getDailyChallenge };
}

describe("DailyChallengeScreen", () => {
  it("should_render_the_ready_card_and_metadata_when_the_challenge_loads", async () => {
    const viewModel = vmReturning(CHALLENGE);
    const { getByTestId } = renderWithProviders(
      <DailyChallengeScreen viewModel={viewModel} onBack={jest.fn()} onPlay={jest.fn()} />,
    );

    await waitFor(() => expect(getByTestId("daily-ready")).toBeTruthy());
    expect(getByTestId("daily-date").props.children).toContain("2026-07-10");
    expect(getByTestId("daily-play")).toBeTruthy();
  });

  it("should_start_gameplay_with_the_loaded_challenge_when_play_is_pressed", async () => {
    const onPlay = jest.fn();
    const viewModel = vmReturning(CHALLENGE);
    const { getByTestId } = renderWithProviders(
      <DailyChallengeScreen viewModel={viewModel} onBack={jest.fn()} onPlay={onPlay} />,
    );

    await waitFor(() => expect(getByTestId("daily-play")).toBeTruthy());
    fireEvent.press(getByTestId("daily-play"));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith(CHALLENGE);
  });

  it("should_show_a_recoverable_retry_when_the_backend_fails", async () => {
    const { viewModel, getDailyChallenge } = vmRejecting();
    const { getByTestId, getByText } = renderWithProviders(
      <DailyChallengeScreen viewModel={viewModel} onBack={jest.fn()} onPlay={jest.fn()} />,
    );

    await waitFor(() => expect(getByTestId("error-state")).toBeTruthy());
    fireEvent.press(getByText("Retry"));

    await waitFor(() => expect(getDailyChallenge).toHaveBeenCalledTimes(2));
  });

  it("should_surface_the_fallback_note_for_an_offline_daily_puzzle", async () => {
    const viewModel = vmReturning({ ...CHALLENGE, meta: { ...CHALLENGE.meta, source: "fallback", fallbackUsed: true } });
    const { getByTestId } = renderWithProviders(
      <DailyChallengeScreen viewModel={viewModel} onBack={jest.fn()} onPlay={jest.fn()} />,
    );

    await waitFor(() => expect(getByTestId("daily-fallback-note")).toBeTruthy());
  });
});
