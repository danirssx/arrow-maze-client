import { fireEvent } from "@testing-library/react-native";
import { GameFacade } from "@/application/facades/GameFacade";
import { manualLevels } from "@/application/level-build/fixtures";
import { GameUIController } from "@/presentation/controllers/GameUIController";
import { GameScreen } from "@/presentation/screens/GameScreen";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const firstLevel = manualLevels[0]!;

function setup() {
  const viewModel = new GameViewModel(GameFacade.createDefault());
  viewModel.attach();
  viewModel.startLevel(firstLevel.id, firstLevel.definition);
  const controller = new GameUIController(viewModel);
  return { viewModel, controller };
}

describe("GameScreen", () => {
  it("should_route_cell_tap_through_controller_to_play_turn", () => {
    const { viewModel, controller } = setup();
    const playTurn = jest.spyOn(viewModel, "playTurn");

    const { getByTestId } = renderWithProviders(
      <GameScreen
        viewModel={viewModel}
        controller={controller}
        levelOrder={1}
        onExit={jest.fn()}
        onHome={jest.fn()}
      />
    );

    fireEvent.press(getByTestId("cell-0-1"));

    expect(playTurn).toHaveBeenCalledWith({ row: 0, column: 1 });
  });

  it("should_render_victory_overlay_when_level_is_won", () => {
    const { viewModel, controller } = setup();

    const { getByTestId, queryByTestId } = renderWithProviders(
      <GameScreen
        viewModel={viewModel}
        controller={controller}
        levelOrder={1}
        onExit={jest.fn()}
        onHome={jest.fn()}
      />
    );

    expect(queryByTestId("victory-screen")).toBeNull();

    fireEvent.press(getByTestId("cell-0-1"));
    fireEvent.press(getByTestId("cell-0-2"));

    expect(getByTestId("victory-screen")).toBeTruthy();
  });
});
