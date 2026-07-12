import { act, fireEvent } from "@testing-library/react-native";
import { createGameFacade } from "@/framework/config/game";
import { manualLevels } from "@/application/level-build/fixtures";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { CollisionService } from "@/domain/board/CollisionService";
import { GameUIController } from "@/presentation/controllers/GameUIController";
import { GameScreen } from "@/presentation/screens/GameScreen";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const firstLevel = manualLevels[0]!;
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

function setup() {
  const viewModel = new GameViewModel(createGameFacade());
  viewModel.attach();
  viewModel.startLevel(firstLevel.id, firstLevel.definition);
  const controller = new GameUIController(viewModel);
  return { viewModel, controller };
}

describe("GameScreen", () => {
  it("should_route_arrow_tap_through_controller_to_tap_arrow", () => {
    const { viewModel, controller } = setup();
    const tapArrow = jest.spyOn(viewModel, "tapArrow");

    const { getByTestId } = renderWithProviders(
      <GameScreen viewModel={viewModel} controller={controller} levelOrder={1} onExit={jest.fn()} onHome={jest.fn()} />
    );

    fireEvent.press(getByTestId("arrow-a"));

    expect(tapArrow).toHaveBeenCalledWith("a");
  });

  it("should_render_victory_overlay_when_the_board_is_cleared", () => {
    const { viewModel, controller } = setup();

    const { getByTestId, queryByTestId } = renderWithProviders(
      <GameScreen viewModel={viewModel} controller={controller} levelOrder={1} onExit={jest.fn()} onHome={jest.fn()} />
    );

    expect(queryByTestId("victory-screen")).toBeNull();

    for (const arrowId of solutionOrder(firstLevel.definition)) {
      fireEvent.press(getByTestId(`arrow-${arrowId}`));
    }

    expect(getByTestId("victory-screen")).toBeTruthy();
  });
});

describe("GameScreen gameplay timer", () => {
  // Covers @s1, @s2, @s3, @s4 of specs/gameplay-visible-timer-MAZ-220.feature
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderGame() {
    const { viewModel, controller } = setup();
    const view = renderWithProviders(
      <GameScreen viewModel={viewModel} controller={controller} levelOrder={1} onExit={jest.fn()} onHome={jest.fn()} />
    );
    return { ...view, viewModel, controller };
  }

  function tick(ms: number) {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  }

  it("should_render_the_elapsed_time_at_zero_when_the_match_starts", () => {
    const { getByTestId } = renderGame();

    expect(getByTestId("game-timer").props.children).toBe("00:00");
  });

  it("should_advance_the_rendered_elapsed_time_when_the_match_is_running", () => {
    const { getByTestId } = renderGame();

    tick(3_000);

    expect(getByTestId("game-timer").props.children).toBe("00:03");
  });

  it("should_freeze_the_rendered_elapsed_time_when_the_match_is_won", () => {
    const { getByTestId } = renderGame();
    tick(2_000);

    for (const arrowId of solutionOrder(firstLevel.definition)) {
      fireEvent.press(getByTestId(`arrow-${arrowId}`));
    }
    const atVictory = getByTestId("game-timer").props.children;
    tick(10_000);

    expect(atVictory).toBe("00:02");
    expect(getByTestId("game-timer").props.children).toBe("00:02");
  });

  it("should_reset_the_rendered_elapsed_time_when_the_match_restarts", () => {
    const { getByTestId } = renderGame();
    tick(5_000);

    fireEvent.press(getByTestId("game-restart"));

    expect(getByTestId("game-timer").props.children).toBe("00:00");
  });

  it("should_stop_refreshing_the_elapsed_time_when_the_screen_unmounts", () => {
    const { unmount, viewModel } = renderGame();
    tick(1_000);
    const refresh = jest.spyOn(viewModel, "refreshElapsedTime");

    unmount();
    jest.advanceTimersByTime(5_000);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("should_stop_refreshing_the_elapsed_time_when_the_match_ends", () => {
    const { getByTestId, viewModel } = renderGame();

    for (const arrowId of solutionOrder(firstLevel.definition)) {
      fireEvent.press(getByTestId(`arrow-${arrowId}`));
    }
    const refresh = jest.spyOn(viewModel, "refreshElapsedTime");
    tick(5_000);

    expect(refresh).not.toHaveBeenCalled();
  });
});
