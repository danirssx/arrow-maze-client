import type { BaseLevel } from "../level/BaseLevel";
import { LevelResult } from "../level/LevelResult";
import type { Position } from "../value-objects/Position";
import type { GamePhase } from "./GamePhase";
import type { IGameState } from "./IGameState";
import { MenuState } from "./MenuState";
import { MissingActiveLevelError } from "./errors";

/**
 * State pattern — context.
 *
 * Holds the active lifecycle state and delegates gameplay commands to it. This
 * is intentionally not a global singleton: each game session owns its context,
 * avoiding hidden shared state while preserving the approved State pattern.
 */
export class GameContext {
  private currentState: IGameState;
  private activeLevel: BaseLevel | undefined;
  private currentResult = LevelResult.playing();

  constructor(initialState: IGameState = new MenuState()) {
    this.currentState = initialState;
  }

  get phase(): GamePhase {
    return this.currentState.phase;
  }

  get level(): BaseLevel | undefined {
    return this.activeLevel;
  }

  get result(): LevelResult {
    return this.currentResult;
  }

  start(level: BaseLevel): void {
    this.currentState.start(this, level);
  }

  move(to: Position): LevelResult {
    return this.currentState.move(this, to);
  }

  pause(): void {
    this.currentState.pause(this);
  }

  resume(): void {
    this.currentState.resume(this);
  }

  transitionTo(state: IGameState): void {
    this.currentState = state;
  }

  activateLevel(level: BaseLevel): void {
    this.activeLevel = level;
    this.currentResult = LevelResult.playing();
  }

  requireLevel(): BaseLevel {
    if (this.activeLevel === undefined) {
      throw new MissingActiveLevelError("Game context has no active level.");
    }
    return this.activeLevel;
  }

  setResult(result: LevelResult): void {
    this.currentResult = result;
  }
}
