import type { ICommand } from "./ICommand";
import { EmptyCommandHistoryError } from "./errors";

/**
 * Command pattern — LIFO history for gameplay undo.
 *
 * Records only successfully executed commands. If command execution throws, the
 * command is not stored, preventing partial or invalid rollbacks.
 */
export class CommandHistory {
  private readonly commands: ICommand[] = [];

  execute<TResult>(command: ICommand<TResult>): TResult {
    const result = command.execute();
    this.commands.push(command);
    return result;
  }

  undoLast(): void {
    const command = this.commands.pop();
    if (command === undefined) {
      throw new EmptyCommandHistoryError("Cannot undo because command history is empty.");
    }
    command.undo();
  }

  get size(): number {
    return this.commands.length;
  }

  get canUndo(): boolean {
    return this.commands.length > 0;
  }
}
