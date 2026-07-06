import { fireEvent, waitFor } from "@testing-library/react-native";
import { manualLevels } from "@/application/level-build/fixtures";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { CollisionService } from "@/domain/board/CollisionService";
import { renderWithProviders } from "../presentation/testUtils";
import GameRoute from "../../app/game";

// Subject to human review — integration test of the game-victory submit effect

const FIRST_LEVEL = manualLevels[0]!;
const FIRST_LEVEL_ID = "550e8400-e29b-41d4-a716-446655440010";

const mockSession = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  username: "arrow_player",
  role: "USER" as const,
  accessToken: "token-1",
};

const mockCompleteLevel = jest.fn<Promise<void>, [string, unknown]>().mockResolvedValue(undefined);
const mockSubmitScore = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);
// Level 1 (index 0) is always unlocked regardless of progress, so an empty progress
// keeps the sequential-locking guard (MAZ-191) satisfied for this level-1 fixture.
const mockLoadProgress = jest
  .fn<Promise<{ completedLevels: { levelId: string }[] }>, [string]>()
  .mockResolvedValue({ completedLevels: [] });

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn(), dismissAll: jest.fn() }),
  useLocalSearchParams: () => ({ levelId: "550e8400-e29b-41d4-a716-446655440010" }),
}));

jest.mock("@/framework/auth/AuthGate", () => ({
  useAuthSession: () => ({ loading: false, session: mockSession }),
}));

jest.mock("@/framework/config/progress", () => ({
  createProgressFacade: () => ({ completeLevel: mockCompleteLevel, load: mockLoadProgress }),
}));

jest.mock("@/framework/config/leaderboard", () => ({
  createLeaderboardFacade: () => ({ submitScore: mockSubmitScore }),
}));

jest.mock("@/framework/config/levelCatalog", () => {
  const actual = jest.requireActual("@/presentation/view-models/LevelSelectViewModel");
  return { createLevelSelectViewModel: () => new actual.LevelSelectViewModel() };
});

const collision = new CollisionService();

function solutionOrder(definition: LevelDefinition): string[] {
  const board = new BoardGroup(definition.arrows.map((spec) => new ArrowEntity(spec)));
  const order: string[] = [];

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const arrow of board.activeArrows()) {
      if (collision.canExtract(board, arrow.id)) {
        arrow.extract();
        order.push(arrow.id);
        progressed = true;
      }
    }
  }

  if (board.activeArrowCount() !== 0) throw new Error("Fixture is not fully solvable");
  return order;
}

const ORDER = solutionOrder(FIRST_LEVEL.definition);

describe("Game victory submit (integration)", () => {
  beforeEach(() => {
    mockCompleteLevel.mockClear();
    mockSubmitScore.mockClear();
    mockSubmitScore.mockResolvedValue(undefined);
  });

  it("should_persist_completion_and_submit_score_with_uuid_level_id_when_a_level_is_won", async () => {
    const { getByTestId, findByTestId, findByText } = renderWithProviders(<GameRoute />);

    // Wait for the catalog to load and the board to render.
    await findByTestId(`arrow-${ORDER[0]}`);

    for (const arrowId of ORDER) {
      fireEvent.press(getByTestId(`arrow-${arrowId}`));
    }

    await waitFor(() => expect(mockCompleteLevel).toHaveBeenCalledTimes(1));
    expect(mockSubmitScore).toHaveBeenCalledTimes(1);

    const [userId, completion] = mockCompleteLevel.mock.calls[0]!;
    expect(userId).toBe(mockSession.userId);
    expect(completion).toMatchObject({ levelId: FIRST_LEVEL_ID, movesCount: ORDER.length });

    // submitScore({ levelId, score, timeSeconds, movesCount })
    const [request] = mockSubmitScore.mock.calls[0]!;
    expect(request).toMatchObject({ levelId: FIRST_LEVEL_ID, movesCount: ORDER.length });
    expect(request).not.toHaveProperty("leaderboardId");
    expect(request).not.toHaveProperty("entryId");
    expect(request).not.toHaveProperty("usernameSnapshot");
    await findByText("Score submitted.");
  });

  it("should_submit_only_once_per_win", async () => {
    const { getByTestId, findByTestId } = renderWithProviders(<GameRoute />);
    await findByTestId(`arrow-${ORDER[0]}`);

    for (const arrowId of ORDER) {
      fireEvent.press(getByTestId(`arrow-${arrowId}`));
    }

    await waitFor(() => expect(mockSubmitScore).toHaveBeenCalledTimes(1));
    expect(mockCompleteLevel).toHaveBeenCalledTimes(1);
  });

  it("should_show_warning_and_keep_actions_when_leaderboard_submission_fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockSubmitScore.mockRejectedValueOnce(new Error("leaderboard unavailable"));
    const { getByTestId, findByTestId, findByText } = renderWithProviders(<GameRoute />);
    await findByTestId(`arrow-${ORDER[0]}`);

    for (const arrowId of ORDER) {
      fireEvent.press(getByTestId(`arrow-${arrowId}`));
    }

    await waitFor(() => expect(mockCompleteLevel).toHaveBeenCalledTimes(1));
    expect(mockSubmitScore).toHaveBeenCalledTimes(1);
    await findByText("Score could not be submitted. Your completion was saved.");
    expect(getByTestId("victory-play-again")).toBeTruthy();
    expect(getByTestId("victory-home")).toBeTruthy();
    warnSpy.mockRestore();
  });
});
