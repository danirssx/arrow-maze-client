import { fireEvent } from "@testing-library/react-native";
import { GameFacade } from "@/application/facades/GameFacade";
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
  const viewModel = new GameViewModel(GameFacade.createDefault());
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
