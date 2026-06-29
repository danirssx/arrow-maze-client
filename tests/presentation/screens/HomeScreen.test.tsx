import { fireEvent } from "@testing-library/react-native";
import { HomeScreen } from "@/presentation/screens/HomeScreen";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const handlers = {
  onPlay: jest.fn(),
  onChallenges: jest.fn(),
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

  it("should_call_on_settings_when_settings_is_pressed", () => {
    const onSettings = jest.fn();
    const { getByTestId } = renderWithProviders(<HomeScreen {...handlers} onSettings={onSettings} />);

    fireEvent.press(getByTestId("home-settings"));

    expect(onSettings).toHaveBeenCalledTimes(1);
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
