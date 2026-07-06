import { fireEvent } from "@testing-library/react-native";
import { manualLevels } from "@/application/level-build/fixtures";
import { renderWithProviders } from "../presentation/testUtils";
import GameRoute from "../../app/game";

// Subject to human review — integration test of the sequential-locking route guard (MAZ-191)

// Level 2: its predecessor (level 1) is NOT completed below, so it must stay locked.
const mockLockedLevelId = manualLevels[1]!.id;
const mockReplace = jest.fn();
const mockSession = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  username: "arrow_player",
  role: "USER" as const,
  accessToken: "token-1",
  refreshToken: "refresh-1",
};
const mockLoadProgress = jest
  .fn<Promise<{ completedLevels: { levelId: string }[] }>, [string]>()
  .mockResolvedValue({ completedLevels: [] });

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace, push: jest.fn(), dismissAll: jest.fn() }),
  useLocalSearchParams: () => ({ levelId: mockLockedLevelId }),
}));

jest.mock("@/framework/auth/AuthGate", () => ({
  useAuthSession: () => ({ loading: false, session: mockSession }),
}));

jest.mock("@/framework/config/progress", () => ({
  createProgressFacade: () => ({ load: mockLoadProgress, completeLevel: jest.fn() }),
}));

jest.mock("@/framework/config/leaderboard", () => ({
  createLeaderboardFacade: () => ({ submitScore: jest.fn() }),
}));

jest.mock("@/framework/config/levelCatalog", () => {
  const actual = jest.requireActual("@/presentation/view-models/LevelSelectViewModel");
  return { createLevelSelectViewModel: () => new actual.LevelSelectViewModel() };
});

describe("Game route sequential-locking guard (integration)", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("should_block_play_and_show_a_locked_state_when_deep_linking_to_a_locked_level", async () => {
    const { findByTestId, queryByTestId } = renderWithProviders(<GameRoute />);

    await findByTestId("level-locked");
    // The board never renders for a locked level (no arrow tap targets).
    expect(queryByTestId(`arrow-${manualLevels[1]!.definition.arrows[0]!.id}`)).toBeNull();
  });

  it("should_route_back_to_the_level_list_from_the_locked_state", async () => {
    const { findByTestId } = renderWithProviders(<GameRoute />);

    fireEvent.press(await findByTestId("level-locked-back"));

    expect(mockReplace).toHaveBeenCalled();
  });
});
