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

    fireEvent.press(getByTestId("arrow-a"));
    fireEvent.press(getByTestId("arrow-b"));

    expect(getByTestId("victory-screen")).toBeTruthy();
  });
});
