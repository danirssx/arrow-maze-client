import { fireEvent } from "@testing-library/react-native";
import { HomeScreen } from "@/presentation/screens/HomeScreen";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test (MAZ-193 truthful Home copy)

const handlers = {
  onPlay: jest.fn(),
  onLeaderboard: jest.fn(),
  onProgress: jest.fn(),
  onSettings: jest.fn()
};

describe("HomeScreen", () => {
  it("should_render_play_call_to_action", () => {
    const { getByTestId } = renderWithProviders(<HomeScreen {...handlers} />);
    expect(getByTestId("home-play")).toBeTruthy();
  });

  it("should_call_on_play_when_play_is_pressed", () => {
    const onPlay = jest.fn();
    const { getByTestId } = renderWithProviders(<HomeScreen {...handlers} onPlay={onPlay} />);
    fireEvent.press(getByTestId("home-play"));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("should_route_the_leaderboard_card_to_the_leaderboard", () => {
    const onLeaderboard = jest.fn();
    const { getByTestId } = renderWithProviders(<HomeScreen {...handlers} onLeaderboard={onLeaderboard} />);
    fireEvent.press(getByTestId("home-card-leaderboard"));
    expect(onLeaderboard).toHaveBeenCalledTimes(1);
  });

  it("should_route_the_progress_card_to_progress", () => {
    const onProgress = jest.fn();
    const { getByTestId } = renderWithProviders(<HomeScreen {...handlers} onProgress={onProgress} />);
    fireEvent.press(getByTestId("home-card-progress"));
    expect(onProgress).toHaveBeenCalledTimes(1);
  });

  it("should_route_the_settings_card_to_settings", () => {
    const onSettings = jest.fn();
    const { getByTestId } = renderWithProviders(<HomeScreen {...handlers} onSettings={onSettings} />);
    fireEvent.press(getByTestId("home-card-settings"));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("should_show_truthful_card_labels_and_no_misleading_reward_or_daily_copy", () => {
    const { getByText, queryByText } = renderWithProviders(<HomeScreen {...handlers} />);

    // Labels name their real destination...
    expect(getByText("Leaderboard")).toBeTruthy();
    expect(getByText("Your progress")).toBeTruthy();
    expect(getByText("Settings")).toBeTruthy();
    // ...and the misleading rewards/daily/follow copy is gone.
    expect(queryByText("Win rewards")).toBeNull();
    expect(queryByText("Daily challenges")).toBeNull();
    expect(queryByText("Follow the arrow")).toBeNull();
  });

  it("should_show_username_and_logout_when_session_identity_is_provided", () => {
    const onLogout = jest.fn();
    const { getByText, getByTestId } = renderWithProviders(
      <HomeScreen {...handlers} username="alice" onLogout={onLogout} />,
    );
    expect(getByText("alice")).toBeTruthy();
    fireEvent.press(getByTestId("home-logout"));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
