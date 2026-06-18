import type { PositionDto } from "@/application/use-cases/game/GameSnapshotDto";
import type { GameViewModel } from "@/presentation/view-models/GameViewModel";

/**
 * MVVM — gameplay UI controller.
 *
 * Translates raw user input from the `GameScreen` into ViewModel intents. It
 * keeps the view free of any decision logic: a cell tap maps to exactly one
 * `GameViewModel.playTurn` call, and HUD buttons map to undo/restart. The
 * controller never reads game rules or domain state itself.
 */
export class GameUIController {
  constructor(private readonly viewModel: GameViewModel) {}

  handleCellTap(position: PositionDto): void {
    this.viewModel.playTurn(position);
  }

  handleUndo(): void {
    this.viewModel.undo();
  }

  handleRestart(): void {
    this.viewModel.restart();
  }
}
