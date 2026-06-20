import { GameFacade } from "@/application/facades/GameFacade";
import { GameUIController } from "@/presentation/controllers/GameUIController";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";

// Subject to human review — presentation controller test

function makeController(): { controller: GameUIController; viewModel: GameViewModel } {
  const viewModel = new GameViewModel(GameFacade.createDefault());
  return { controller: new GameUIController(viewModel), viewModel };
}

describe("GameUIController", () => {
  it("should_call_tap_arrow_only_when_an_arrow_is_tapped", () => {
    const { controller, viewModel } = makeController();
    const tapArrow = jest.spyOn(viewModel, "tapArrow").mockImplementation(() => undefined);
    const undo = jest.spyOn(viewModel, "undo").mockImplementation(() => undefined);
    const restart = jest.spyOn(viewModel, "restart").mockImplementation(() => undefined);

    controller.handleArrowTap("a");

    expect(tapArrow).toHaveBeenCalledWith("a");
    expect(tapArrow).toHaveBeenCalledTimes(1);
    expect(undo).not.toHaveBeenCalled();
    expect(restart).not.toHaveBeenCalled();
  });

  it("should_delegate_undo_and_restart_to_view_model", () => {
    const { controller, viewModel } = makeController();
    const undo = jest.spyOn(viewModel, "undo").mockImplementation(() => undefined);
    const restart = jest.spyOn(viewModel, "restart").mockImplementation(() => undefined);

    controller.handleUndo();
    controller.handleRestart();

    expect(undo).toHaveBeenCalledTimes(1);
    expect(restart).toHaveBeenCalledTimes(1);
  });
});
