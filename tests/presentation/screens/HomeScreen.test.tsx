import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent } from "@testing-library/react-native";
import { HomeScreen } from "@/presentation/screens/HomeScreen";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test (MAZ-215 Home account polish)

const handlers = {
  onPlay: jest.fn(),
  onDailyChallenge: jest.fn(),
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

  it("should_expose_a_daily_challenge_entrypoint_that_invokes_the_intent_once", () => {
    const onDailyChallenge = jest.fn();
    const { getByTestId } = renderWithProviders(
      <HomeScreen {...handlers} onDailyChallenge={onDailyChallenge} />,
    );
    fireEvent.press(getByTestId("home-card-daily"));
    expect(onDailyChallenge).toHaveBeenCalledTimes(1);
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

  it("should_show_username_and_clear_logout_action_when_session_identity_is_provided", () => {
    const onLogout = jest.fn();
    const { getByText, getByTestId } = renderWithProviders(
      <HomeScreen {...handlers} username="alice" onLogout={onLogout} />,
    );

    expect(getByText("alice")).toBeTruthy();
    expect(getByTestId("home-username").props.children).toBe("alice");
    expect(getByTestId("home-account")).toBeTruthy();
    expect(getByTestId("home-logout")).toBeTruthy();
    expect(getByTestId("home-logout-label").props.className).toContain("text-sm");
  });

  it("should_call_logout_once_when_home_logout_is_pressed", () => {
    const onLogout = jest.fn();
    const { getByTestId } = renderWithProviders(<HomeScreen {...handlers} username="alice" onLogout={onLogout} />);

    fireEvent.press(getByTestId("home-logout"));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("should_not_show_fake_account_information_when_session_identity_is_missing", () => {
    const { queryByTestId, queryByText } = renderWithProviders(<HomeScreen {...handlers} />);

    expect(queryByTestId("home-account")).toBeNull();
    expect(queryByTestId("home-username")).toBeNull();
    expect(queryByTestId("home-logout")).toBeNull();
    expect(queryByText("Guest")).toBeNull();
  });

  it("should_not_render_coin_badge_or_coin_amount", () => {
    const { queryByTestId, queryByText } = renderWithProviders(<HomeScreen {...handlers} />);

    expect(queryByTestId("home-coins")).toBeNull();
    expect(queryByText("0")).toBeNull();
  });

  it("should_keep_home_as_a_dumb_mvvm_view_when_source_is_inspected", () => {
    const source = readFileSync(join(process.cwd(), "src/presentation/screens/HomeScreen.tsx"), "utf8");

    expect(source).not.toMatch(/@\/(framework|infrastructure|domain)/);
    expect(source).not.toMatch(/useAuthSession|SessionManager|Repository|Adapter|completeLevel|submitScore/);
    expect(source).not.toMatch(/CoinBadge|home-coins|coins\??:/);
  });
});
