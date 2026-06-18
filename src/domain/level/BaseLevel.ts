import type { BoardGraph } from "../board/BoardGraph";
import { BoardGraphBuilder } from "../board/BoardGraphBuilder";
import { BoardGroup } from "../board/BoardGroup";
import { CellFactory } from "../factory/CellFactory";
import type { ICellFactory } from "../factory/ICellFactory";
import { GameEventEmitter } from "../observer/GameEventEmitter";
import type { IGameObserver } from "../observer/IGameObserver";
import type { IObservable } from "../observer/IObservable";
import { CellEscapedEvent, LevelFinishedEvent, MoveExecutedEvent } from "../observer/GameEvent";
import { CellType } from "../value-objects/CellType";
import type { LevelTemplate } from "../value-objects/LevelTemplate";
import type { Position } from "../value-objects/Position";
import type { DefeatReason } from "./LevelResult";
import { LevelResult } from "./LevelResult";
import { IllegalMoveError, InvalidLevelStartError, InvalidMoveCountError, MissingExitError } from "./errors";

/**
 * Template Method pattern — abstract level lifecycle.
 *
 * Defines the invariant skeleton of a playable level (build the board, derive
 * its movement graph, move the player under graph constraints, and evaluate the
 * outcome) while deferring the defeat condition to subclasses through the
 * protected `evaluateDefeat` hook. `NormalLevel` and `TimedLevel` reuse the
 * whole skeleton and only specialize that single step.
 *
 * The class is domain-pure: it knows nothing about UI, ViewModels, navigation,
 * persistence, or the backend. Movement is constrained exclusively by the
 * directed `BoardGraph`, so an unconnected destination fails in a controlled
 * way (`IllegalMoveError`).
 *
 * It is also the Observer-pattern subject for gameplay: observers register to
 * receive domain events (`MoveExecuted`, `CellEscaped`, `LevelFinished`) without
 * the level depending on UI or audio.
 */
export abstract class BaseLevel implements IObservable {
  protected readonly board: BoardGroup;
  protected readonly graph: BoardGraph;
  protected readonly exitPosition: Position;

  private currentPosition: Position;
  private moveCount = 0;
  private readonly events = new GameEventEmitter();
  private finishedNotified = false;

  protected constructor(
    protected readonly template: LevelTemplate,
    start: Position,
    factory: ICellFactory = new CellFactory(),
    graphBuilder: BoardGraphBuilder = new BoardGraphBuilder()
  ) {
    this.board = new BoardGroup(template.cells.map((spec) => factory.create(spec)));
    this.graph = graphBuilder.build(this.board, template.rows, template.cols);
    this.exitPosition = BaseLevel.resolveExit(template);

    if (!this.graph.hasNode(start)) {
      throw new InvalidLevelStartError(
        `Start position ${start.toKey()} is not a navigable cell in level ${template.id}.`
      );
    }
    this.currentPosition = start;
  }

  /** Current player position on the board. */
  get position(): Position {
    return this.currentPosition;
  }

  /** Number of legal moves performed so far. */
  get moves(): number {
    return this.moveCount;
  }

  /** Observer pattern: subscribe an observer to this level's game events. */
  register(observer: IGameObserver): void {
    this.events.register(observer);
  }

  /** Observer pattern: unsubscribe a previously registered observer. */
  unregister(observer: IGameObserver): void {
    this.events.unregister(observer);
  }

  /**
   * Move the player to an adjacent cell.
   *
   * The move is accepted only when the directed board graph has an edge from
   * the current position to `to`; otherwise it is rejected with
   * `IllegalMoveError` and the level state is left untouched.
   */
  move(to: Position): void {
    if (!this.graph.canMove(this.currentPosition, to)) {
      throw new IllegalMoveError(
        `Illegal move from ${this.currentPosition.toKey()} to ${to.toKey()}: positions are not connected.`
      );
    }
    const from = this.currentPosition;
    this.currentPosition = to;
    this.moveCount += 1;
    this.afterMove(to);

    this.events.emit(new CellEscapedEvent(from));
    this.events.emit(new MoveExecutedEvent(from, to, this.moveCount));
  }

  canMoveTo(to: Position): boolean {
    return this.graph.canMove(this.currentPosition, to);
  }

  /**
   * Restore movement progress after a command undo.
   *
   * Only valid graph nodes and non-negative integer move counts can be
   * restored, keeping command undo deterministic without exposing mutable
   * internals directly.
   */
  restoreProgress(position: Position, moves: number): void {
    if (!this.graph.hasNode(position)) {
      throw new InvalidLevelStartError(`Cannot restore level ${this.template.id} to ${position.toKey()}.`);
    }
    if (!Number.isInteger(moves) || moves < 0) {
      throw new InvalidMoveCountError(`Cannot restore level ${this.template.id} with move count ${moves}.`);
    }
    this.currentPosition = position;
    this.moveCount = moves;
    this.finishedNotified = false;
  }

  /**
   * Template Method: evaluate the current outcome.
   *
   * Fixed algorithm shared by every level kind: a defeat condition (defined by
   * the subclass) takes precedence, then victory by reaching the exit, then the
   * still-playing state. Subclasses must not override this method; they
   * specialize the protected hooks instead.
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
    const defeat = this.evaluateDefeat();
    if (defeat !== undefined) {
      return LevelResult.lost(defeat);
    }
    if (this.hasReachedExit()) {
      return LevelResult.won();
    }
    return LevelResult.playing();
  }

  /**
   * Primitive operation (hook): the defeat condition for this level kind.
   *
   * Return a `DefeatReason` when the level is lost, or `undefined` otherwise.
   */
  protected abstract evaluateDefeat(): DefeatReason | undefined;

  /**
   * Hook with a default implementation: victory is reaching the exit cell.
   *
   * Because every move is validated against the graph, reaching the exit
   * implies the player followed an allowed route.
   */
  protected hasReachedExit(): boolean {
    return this.currentPosition.equals(this.exitPosition);
  }

  /**
   * Hook with an empty default implementation, invoked after each legal move.
   *
   * Subclasses may override it to react to movement (e.g. count steps for a
   * move-limited variant) without altering the move algorithm itself.
   */
  protected afterMove(_to: Position): void {
    // Intentionally empty: base levels do not react to movement.
  }

  private static resolveExit(template: LevelTemplate): Position {
    const exit = template.cells.find((spec) => spec.type === CellType.Exit);
    if (exit === undefined) {
      throw new MissingExitError(`Level ${template.id} has no exit cell.`);
    }
    return exit.position;
  }
}
