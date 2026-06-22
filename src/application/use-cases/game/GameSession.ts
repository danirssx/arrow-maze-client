import { CommandHistory } from "../../../domain/command/CommandHistory";
import type { Clock } from "../../../domain/level/Clock";
import { systemClock } from "../../../domain/level/Clock";
import { GameContext } from "../../../domain/state/GameContext";
import type { BuiltLevel } from "../../level-build/BuiltLevel";
import type { ILevelStrategy } from "../../level-build/ILevelStrategy";
import { GameplayStateError } from "./errors";

/**
 * Application session state for gameplay use cases.
 *
 * Keeps the domain `GameContext`, the command history, and the selected level
 * strategy (for restart) together without leaking storage, HTTP, React, or
 * ViewModel concerns into domain objects.
 *
 * It also owns the result metrics scoring/progress need: elapsed play time
 * (measured through an injected `Clock`, frozen the first time the level result
 * is terminal so victory time is deterministic) and the moves count (the size of
 * the command history). Presentation never measures these; it reads them from the
 * application snapshot. The `Clock` is the domain time port, so the session never
 * touches `Date.now()` directly.
 */
export class GameSession {
  private context: GameContext | undefined;
  private history: CommandHistory | undefined;
  private currentStrategy: ILevelStrategy | undefined;
  private startedAtMs: number | undefined;
  private finishedAtMs: number | undefined;

  constructor(private readonly clock: Clock = systemClock) {}

  start(built: BuiltLevel, strategy: ILevelStrategy): void {
    const context = new GameContext();
    context.start(built.level);

    this.context = context;
    this.history = new CommandHistory();
    this.currentStrategy = strategy;
    this.startedAtMs = this.clock();
    this.finishedAtMs = undefined;
  }

  /** Elapsed play time in ms, frozen at the moment the level result is terminal. */
  elapsedMs(): number {
    if (this.startedAtMs === undefined) {
      return 0;
    }
    if (this.finishedAtMs === undefined && this.isTerminal()) {
      this.finishedAtMs = this.clock();
    }
    const end = this.finishedAtMs ?? this.clock();
    return Math.max(0, end - this.startedAtMs);
  }

  /** Number of recorded extractions (the command-history size). */
  movesCount(): number {
    return this.history?.size ?? 0;
  }

  private isTerminal(): boolean {
    return this.context !== undefined && !this.context.result.isPlaying();
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

  requireStrategy(): ILevelStrategy {
    if (this.currentStrategy === undefined) {
      throw new GameplayStateError("Cannot restart before a level is started.");
    }
    return this.currentStrategy;
  }
}
