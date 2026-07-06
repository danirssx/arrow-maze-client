import { VictoryScreen } from "@/presentation/screens/VictoryScreen";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const handlers = {
  onPlayAgain: jest.fn(),
  onHome: jest.fn(),
};

describe("VictoryScreen", () => {
  beforeEach(() => {
    handlers.onPlayAgain.mockClear();
    handlers.onHome.mockClear();
  });

  it("should_show_success_copy_when_leaderboard_score_is_synced", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <VictoryScreen {...handlers} leaderboardSubmitStatus="synced" />
    );

    expect(getByTestId("victory-leaderboard-status")).toBeTruthy();
    expect(getByText("Score submitted.")).toBeTruthy();
  });

  it("should_show_skipped_copy_when_level_does_not_have_backend_uuid", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <VictoryScreen {...handlers} leaderboardSubmitStatus="skipped" />
    );

    expect(getByTestId("victory-leaderboard-status")).toBeTruthy();
    expect(getByText("Score was not submitted for this offline level.")).toBeTruthy();
  });

  it("should_keep_victory_actions_visible_when_leaderboard_score_fails", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <VictoryScreen {...handlers} leaderboardSubmitStatus="failed" />
    );

    expect(getByText("Score could not be submitted. Your completion was saved.")).toBeTruthy();
    expect(getByTestId("victory-play-again")).toBeTruthy();
    expect(getByTestId("victory-home")).toBeTruthy();
  });
});
