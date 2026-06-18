import type { GameViewModel } from "@/presentation/view-models/GameViewModel";

/**
 * MVVM — gameplay UI controller.
 *
 * Translates raw user input from the `GameScreen` into ViewModel intents. It
 * keeps the view free of decision logic: an arrow tap maps to exactly one
 * `GameViewModel.tapArrow` call, and HUD buttons map to undo/restart. The
 * controller never reads game rules or domain state itself.
 */
export class GameUIController {
  constructor(private readonly viewModel: GameViewModel) {}

  handleArrowTap(arrowId: string): void {
    this.viewModel.tapArrow(arrowId);
  }

  handleUndo(): void {
    this.viewModel.undo();
  }

  handleRestart(): void {
    this.viewModel.restart();
  }
}
