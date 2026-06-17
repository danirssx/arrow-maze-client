import type { LevelResult } from "../level/LevelResult";
import type { GameContext, GameContextSnapshot } from "../state/GameContext";
import type { Position } from "../value-objects/Position";
import type { ICommand } from "./ICommand";
import { CommandAlreadyExecutedError, CommandNotExecutedError } from "./errors";

type MoveCommandSnapshot = {
  readonly position: Position;
  readonly moves: number;
  readonly context: GameContextSnapshot;
};

/**
 * Command pattern — reversible player movement.
 *
 * Delegates movement validation to the active `GameContext`/`BaseLevel`, whose
 * board graph is the source of truth. The snapshot is stored only after a
 * successful move, so failed commands are never undoable or recorded.
 */
export class MoveCommand implements ICommand<LevelResult> {
  private snapshot: MoveCommandSnapshot | undefined;

  constructor(
    private readonly context: GameContext,
    private readonly destination: Position
  ) {}

  execute(): LevelResult {
    if (this.snapshot !== undefined) {
      throw new CommandAlreadyExecutedError("MoveCommand cannot be executed more than once.");
    }

    const level = this.context.requireLevel();
    const snapshot: MoveCommandSnapshot = {
      position: level.position,
      moves: level.moves,
      context: this.context.snapshot()
    };
    const result = this.context.move(this.destination);
    this.snapshot = snapshot;

    return result;
  }

  undo(): void {
    if (this.snapshot === undefined) {
      throw new CommandNotExecutedError("MoveCommand cannot be undone before execution.");
    }

    const level = this.context.requireLevel();
    level.restoreProgress(this.snapshot.position, this.snapshot.moves);
    this.context.restore(this.snapshot.context);
  }
}
