import { CommandHistory } from "../../../domain/command/CommandHistory";
import { GameContext } from "../../../domain/state/GameContext";
import type { BuiltLevel } from "../../level-build/BuiltLevel";
import type { ILevelStrategy } from "../../level-build/ILevelStrategy";
import { GameplayStateError } from "./errors";

/**
 * Application session state for gameplay use cases.
 *
 * Keeps the domain `GameContext`, command history, selected level strategy, and
 * computed optimal-move metadata together without leaking storage, HTTP, React,
 * or ViewModel concerns into domain objects.
 */
export class GameSession {
  private context: GameContext | undefined;
  private history: CommandHistory | undefined;
  private currentOptimalMoves: number | undefined;
  private currentStrategy: ILevelStrategy | undefined;

  start(built: BuiltLevel, strategy: ILevelStrategy): void {
    const context = new GameContext();
    context.start(built.level);

    this.context = context;
    this.history = new CommandHistory();
    this.currentOptimalMoves = built.optimalMoves;
    this.currentStrategy = strategy;
  }

  requireContext(): GameContext {
    if (this.context === undefined) {
      throw new GameplayStateError("Cannot use gameplay session before a level is started.");
    }
    return this.context;
  }

  requireHistory(): CommandHistory {
    if (this.history === undefined) {
      throw new GameplayStateError("Cannot use command history before a level is started.");
    }
    return this.history;
  }

  requireOptimalMoves(): number {
    if (this.currentOptimalMoves === undefined) {
      throw new GameplayStateError("Cannot read optimal moves before a level is started.");
    }
    return this.currentOptimalMoves;
  }

  requireStrategy(): ILevelStrategy {
    if (this.currentStrategy === undefined) {
      throw new GameplayStateError("Cannot restart before a level is started.");
    }
    return this.currentStrategy;
  }
}
