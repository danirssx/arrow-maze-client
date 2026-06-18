import type { BaseLevel } from "../level/BaseLevel";
import { LevelResult } from "../level/LevelResult";
import type { Position } from "../value-objects/Position";
import { GamePhase } from "./GamePhase";
import type { IGameState } from "./IGameState";
import { GameOverState } from "./GameOverState";
import { MenuState } from "./MenuState";
import { PausedState } from "./PausedState";
import { PlayingState } from "./PlayingState";
import { VictoryState } from "./VictoryState";
import { MissingActiveLevelError } from "./errors";

export type GameContextSnapshot = {
  readonly phase: GamePhase;
  readonly result: LevelResult;
};

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

  snapshot(): GameContextSnapshot {
    return {
      phase: this.phase,
      result: this.currentResult
    };
  }

  restore(snapshot: GameContextSnapshot): void {
    this.currentState = GameContext.stateFromPhase(snapshot.phase);
    this.currentResult = snapshot.result;
  }

  private static stateFromPhase(phase: GamePhase): IGameState {
    switch (phase) {
      case GamePhase.Menu:
        return new MenuState();
      case GamePhase.Playing:
        return new PlayingState();
      case GamePhase.Paused:
        return new PausedState();
      case GamePhase.GameOver:
        return new GameOverState();
      case GamePhase.Victory:
        return new VictoryState();
    }
  }
}
