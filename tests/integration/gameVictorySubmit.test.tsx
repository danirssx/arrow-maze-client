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

const mockCompleteLevel = jest.fn<Promise<void>, [string, string, unknown]>().mockResolvedValue(undefined);
const mockSubmitScore = jest.fn<Promise<void>, [unknown, string]>().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn(), dismissAll: jest.fn() }),
  useLocalSearchParams: () => ({ levelId: "550e8400-e29b-41d4-a716-446655440010" }),
}));

jest.mock("@/framework/auth/AuthGate", () => ({
  useAuthSession: () => ({ loading: false, session: mockSession }),
}));

jest.mock("@/framework/config/progress", () => ({
  createProgressFacade: () => ({ completeLevel: mockCompleteLevel }),
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
  });

  it("should_persist_completion_and_submit_score_with_uuid_level_id_when_a_level_is_won", async () => {
    const { getByTestId, findByTestId } = renderWithProviders(<GameRoute />);

    // Wait for the catalog to load and the board to render.
    await findByTestId(`arrow-${ORDER[0]}`);

    for (const arrowId of ORDER) {
      fireEvent.press(getByTestId(`arrow-${arrowId}`));
    }

    await waitFor(() => expect(mockCompleteLevel).toHaveBeenCalledTimes(1));
    expect(mockSubmitScore).toHaveBeenCalledTimes(1);

    // completeLevel(userId, accessToken, { levelId, score, timeSeconds, movesCount, completedAt })
    const [userId, accessToken, completion] = mockCompleteLevel.mock.calls[0]!;
    expect(userId).toBe(mockSession.userId);
    expect(accessToken).toBe(mockSession.accessToken);
    expect(completion).toMatchObject({ levelId: FIRST_LEVEL_ID, movesCount: ORDER.length });

    // submitScore({ leaderboardId, entryId, levelId, usernameSnapshot, ... }, accessToken)
    const [request, token] = mockSubmitScore.mock.calls[0]!;
    expect(token).toBe(mockSession.accessToken);
    expect(request).toMatchObject({ levelId: FIRST_LEVEL_ID, usernameSnapshot: mockSession.username, movesCount: ORDER.length });
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
});
