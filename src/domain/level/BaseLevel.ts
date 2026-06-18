import type { BoardGroup } from "../board/BoardGroup";
import { CollisionService } from "../board/CollisionService";
import { LevelFinishedEvent } from "../observer/GameEvent";
import { GameEventEmitter } from "../observer/GameEventEmitter";
import type { IGameObserver } from "../observer/IGameObserver";
import type { IObservable } from "../observer/IObservable";
import { DefeatReason, LevelResult } from "./LevelResult";
import { ArrowNotExtractableError, InvalidAttemptsError } from "./errors";

/**
 * Template Method pattern — abstract level lifecycle (arrow untangle engine).
 *
 * Defines the invariant skeleton of a playable level (extract arrows whose ray
 * is clear, register failed taps under an attempts budget, and evaluate the
 * outcome) while deferring extra defeat conditions to subclasses through the
 * protected `evaluateDefeat` hook. `NormalLevel` adds none; `TimedLevel` adds a
 * time limit.
 *
 * Domain-pure: it knows nothing about UI, ViewModels, navigation, persistence,
 * or the backend. Extraction validity is decided exclusively by
 * `CollisionService` over the `BoardGroup`. It is also the Observer subject for
 * `LevelFinished`, so observers react to the terminal outcome without the level
 * depending on UI or audio.
 */
export abstract class BaseLevel implements IObservable {
  private readonly collision: CollisionService;
  private remainingAttempts: number;
  private readonly penalizedFailures = new Set<string>();
  private readonly events = new GameEventEmitter();
  private finishedNotified = false;

  protected constructor(
    readonly id: string,
    protected readonly board: BoardGroup,
    attempts: number,
    collision: CollisionService = new CollisionService()
  ) {
    if (!Number.isInteger(attempts) || attempts <= 0) {
      throw new InvalidAttemptsError(`Level ${id} requires a positive integer attempts budget, received ${attempts}.`);
    }
    this.remainingAttempts = attempts;
    this.collision = collision;
  }

  /** Attempts left before a soft defeat. */
  get attemptsRemaining(): number {
    return this.remainingAttempts;
  }

  /** Number of arrows still on the board. */
  get activeArrowCount(): number {
    return this.board.activeArrowCount();
  }

  /** Observer pattern: subscribe to this level's terminal event. */
  register(observer: IGameObserver): void {
    this.events.register(observer);
  }

  /** Observer pattern: unsubscribe a previously registered observer. */
  unregister(observer: IGameObserver): void {
    this.events.unregister(observer);
  }

  /** Whether the arrow's forward ray is currently clear of other active arrows. */
  canExtract(arrowId: string): boolean {
    return this.collision.canExtract(this.board, arrowId);
  }

  /**
   * Extract an arrow whose ray is clear; it flies off the board.
   *
   * Throws `ArrowNotExtractableError` (leaving state untouched) when the arrow is
   * unknown, already extracted, or currently blocked, so a command never records
   * an invalid extraction.
   */
  extractArrow(arrowId: string): void {
    const arrow = this.board.get(arrowId);
    if (arrow === undefined || !arrow.isActive || !this.collision.canExtract(this.board, arrowId)) {
      throw new ArrowNotExtractableError(`Arrow ${arrowId} cannot be extracted in level ${this.id}.`);
    }
    arrow.extract();
  }

  /** Re-place a previously extracted arrow (command undo). */
  restoreArrow(arrowId: string): void {
    const arrow = this.board.get(arrowId);
    if (arrow === undefined) {
      throw new ArrowNotExtractableError(`Arrow ${arrowId} does not exist in level ${this.id}.`);
    }
    arrow.restore();
    this.finishedNotified = false;
  }

  /**
   * Register a failed tap on a blocked arrow.
   *
   * Dedup by arrow id: a given arrow only ever costs one attempt, no matter how
   * many times it is tapped while blocked. Returns whether this tap consumed an
   * attempt.
   */
  registerFailedAttempt(arrowId: string): boolean {
    if (this.penalizedFailures.has(arrowId)) {
      return false;
    }
    this.penalizedFailures.add(arrowId);
    this.remainingAttempts = Math.max(this.remainingAttempts - 1, 0);
    return true;
  }

  /**
   * Template Method: evaluate the current outcome.
   *
   * Fixed algorithm: a defeat condition (subclass hook, then the shared
   * out-of-attempts rule) takes precedence, then victory by an empty board, then
   * still playing. Emits `LevelFinished` once when the outcome first becomes
   * terminal.
   */
  evaluate(): LevelResult {
    const result = this.computeResult();
    if (!result.isPlaying() && !this.finishedNotified) {
      this.finishedNotified = true;
      this.events.emit(new LevelFinishedEvent(result));
    }
    return result;
  }

  private computeResult(): LevelResult {
    const defeat = this.evaluateDefeat() ?? this.attemptsDefeat();
    if (defeat !== undefined) {
      return LevelResult.lost(defeat);
    }
    if (this.board.activeArrowCount() === 0) {
      return LevelResult.won();
    }
    return LevelResult.playing();
  }

  private attemptsDefeat(): DefeatReason | undefined {
    return this.remainingAttempts <= 0 ? DefeatReason.OutOfAttempts : undefined;
  }

  /**
   * Primitive operation (hook): an extra defeat condition for this level kind.
   * Return a `DefeatReason` when lost for that reason, or `undefined` otherwise.
   */
  protected abstract evaluateDefeat(): DefeatReason | undefined;
}
