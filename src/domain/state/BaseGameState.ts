import type { BaseLevel } from "../level/BaseLevel";
import type { LevelResult } from "../level/LevelResult";
import type { GameContext } from "./GameContext";
import type { GamePhase } from "./GamePhase";
import type { IGameState } from "./IGameState";
import { InvalidGameStateActionError } from "./errors";

/**
 * State pattern — base state.
 *
 * Provides controlled rejection for commands a concrete state does not support.
 * Concrete states override only the actions they allow.
 */
export abstract class BaseGameState implements IGameState {
  protected constructor(readonly phase: GamePhase) {}

  start(_context: GameContext, _level: BaseLevel): void {
    throw new InvalidGameStateActionError(`Cannot start a level while game is in ${this.phase}.`);
  }

  extract(_context: GameContext, _arrowId: string): LevelResult {
    throw new InvalidGameStateActionError(`Cannot extract an arrow while game is in ${this.phase}.`);
  }

  failAttempt(_context: GameContext, _arrowId: string): LevelResult {
    throw new InvalidGameStateActionError(`Cannot register a failed tap while game is in ${this.phase}.`);
  }

  pause(_context: GameContext): void {
    throw new InvalidGameStateActionError(`Cannot pause while game is in ${this.phase}.`);
  }

  resume(_context: GameContext): void {
    throw new InvalidGameStateActionError(`Cannot resume while game is in ${this.phase}.`);
  }
}
