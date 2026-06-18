import { GameFacade } from "@/application/facades/GameFacade";
import { GameUIController } from "@/presentation/controllers/GameUIController";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";

// Subject to human review — presentation controller test

function makeController(): { controller: GameUIController; viewModel: GameViewModel } {
  const viewModel = new GameViewModel(GameFacade.createDefault());
  return { controller: new GameUIController(viewModel), viewModel };
}

describe("GameUIController", () => {
  it("should_call_play_turn_only_when_cell_is_tapped", () => {
    const { controller, viewModel } = makeController();
    const playTurn = jest.spyOn(viewModel, "playTurn").mockImplementation(() => undefined);
    const undo = jest.spyOn(viewModel, "undo").mockImplementation(() => undefined);
    const restart = jest.spyOn(viewModel, "restart").mockImplementation(() => undefined);

    controller.handleCellTap({ row: 0, column: 1 });

    expect(playTurn).toHaveBeenCalledWith({ row: 0, column: 1 });
    expect(playTurn).toHaveBeenCalledTimes(1);
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
