import type { LevelResult } from "../level/LevelResult";
import type { GameContext, GameContextSnapshot } from "../state/GameContext";
import type { ICommand } from "./ICommand";
import { CommandAlreadyExecutedError, CommandNotExecutedError } from "./errors";

type ExtractArrowSnapshot = {
  readonly context: GameContextSnapshot;
};

/**
 * Command pattern — reversible arrow extraction.
 *
 * Delegates extraction to the active `GameContext`/`BaseLevel`, whose
 * `CollisionService` is the source of truth. A context snapshot (phase + result)
 * is captured before execution and stored only after a successful extraction, so
 * a blocked or invalid extraction is never recorded or undoable. `undo` re-places
 * the arrow on the board and restores the prior lifecycle phase/result.
 */
export class ExtractArrowCommand implements ICommand<LevelResult> {
  private snapshot: ExtractArrowSnapshot | undefined;

  constructor(
    private readonly context: GameContext,
    private readonly arrowId: string
  ) {}

  execute(): LevelResult {
    if (this.snapshot !== undefined) {
      throw new CommandAlreadyExecutedError("ExtractArrowCommand cannot be executed more than once.");
    }

    const snapshot: ExtractArrowSnapshot = { context: this.context.snapshot() };
    const result = this.context.extract(this.arrowId);
    this.snapshot = snapshot;

    return result;
  }

  undo(): void {
    if (this.snapshot === undefined) {
      throw new CommandNotExecutedError("ExtractArrowCommand cannot be undone before execution.");
    }

    this.context.requireLevel().restoreArrow(this.arrowId);
    this.context.restore(this.snapshot.context);
  }
}
