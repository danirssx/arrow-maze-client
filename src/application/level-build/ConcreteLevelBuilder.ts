import { BoardGraphBuilder } from "../../domain/board/BoardGraphBuilder";
import { BoardGroup } from "../../domain/board/BoardGroup";
import { PathfindingService } from "../../domain/board/PathfindingService";
import { CellFactory } from "../../domain/factory/CellFactory";
import type { ICellFactory } from "../../domain/factory/ICellFactory";
import type { BaseLevel } from "../../domain/level/BaseLevel";
import { NormalLevel } from "../../domain/level/NormalLevel";
import { TimedLevel } from "../../domain/level/TimedLevel";
import { CellType } from "../../domain/value-objects/CellType";
import type { LevelTemplate } from "../../domain/value-objects/LevelTemplate";
import type { Position } from "../../domain/value-objects/Position";
import type { BuiltLevel } from "./BuiltLevel";
import type { ILevelBuilder } from "./ILevelBuilder";
import { LevelKind } from "./LevelDefinition";
import { InvalidLevelDefinitionError, LevelBuildStateError, UnsolvableLevelError } from "./errors";

type LevelBuilderDependencies = {
  factory?: ICellFactory;
  graphBuilder?: BoardGraphBuilder;
  pathfinding?: PathfindingService;
};

/**
 * Builder pattern — concrete level builder.
 *
 * Accumulates the parts of a level and, on `build()`, rebuilds the board graph
 * (Factory Method + Composite + Graph patterns) to validate solvability with
 * `PathfindingService` before instantiating the concrete `BaseLevel`. Domain
 * construction errors are pre-empted by explicit application-level validation,
 * so callers only ever see controlled `ApplicationError`s.
 *
 * Application layer: depends only on domain abstractions and concrete domain
 * classes. It never imports React, Expo, HTTP, or storage.
 */
export class ConcreteLevelBuilder implements ILevelBuilder {
  private readonly factory: ICellFactory;
  private readonly graphBuilder: BoardGraphBuilder;
  private readonly pathfinding: PathfindingService;

  private template: LevelTemplate | undefined;
  private start: Position | undefined;
  private kind: LevelKind = LevelKind.Normal;
  private timeLimitSeconds: number | undefined;

  constructor(dependencies: LevelBuilderDependencies = {}) {
    this.factory = dependencies.factory ?? new CellFactory();
    this.graphBuilder = dependencies.graphBuilder ?? new BoardGraphBuilder();
    this.pathfinding = dependencies.pathfinding ?? new PathfindingService();
  }

  reset(): this {
    this.template = undefined;
    this.start = undefined;
    this.kind = LevelKind.Normal;
    this.timeLimitSeconds = undefined;
    return this;
  }

  useTemplate(template: LevelTemplate): this {
    this.template = template;
    return this;
  }

  startingAt(start: Position): this {
    this.start = start;
    return this;
  }

  asNormal(): this {
    this.kind = LevelKind.Normal;
    this.timeLimitSeconds = undefined;
    return this;
  }

  asTimed(limitSeconds: number): this {
    this.kind = LevelKind.Timed;
    this.timeLimitSeconds = limitSeconds;
    return this;
  }

  build(): BuiltLevel {
    const template = this.requireTemplate();
    const start = this.requireStart();

    const board = new BoardGroup(template.cells.map((spec) => this.factory.create(spec)));
    const graph = this.graphBuilder.build(board, template.rows, template.cols);

    if (!graph.hasNode(start)) {
      throw new InvalidLevelDefinitionError(
        `Start position ${start.toKey()} is not a navigable cell in level ${template.id}.`
      );
    }

    const exit = this.resolveExit(template);
    const optimalMoves = this.pathfinding.calculateOptimalMoves(graph, start, exit);
    if (optimalMoves === undefined) {
      throw new UnsolvableLevelError(
        `Level ${template.id} has no path from ${start.toKey()} to exit ${exit.toKey()}.`
      );
    }

    const level = this.instantiateLevel(template, start);
    return { level, optimalMoves };
  }

  private instantiateLevel(template: LevelTemplate, start: Position): BaseLevel {
    if (this.kind === LevelKind.Timed) {
      if (this.timeLimitSeconds === undefined || this.timeLimitSeconds <= 0) {
        throw new InvalidLevelDefinitionError(
          `Timed level ${template.id} requires a positive time limit in seconds.`
        );
      }
      return new TimedLevel(template, start, this.timeLimitSeconds);
    }
    return new NormalLevel(template, start);
  }

  private resolveExit(template: LevelTemplate): Position {
    const exit = template.cells.find((spec) => spec.type === CellType.Exit);
    if (exit === undefined) {
      throw new InvalidLevelDefinitionError(`Level ${template.id} has no exit cell.`);
    }
    return exit.position;
  }

  private requireTemplate(): LevelTemplate {
    if (this.template === undefined) {
      throw new LevelBuildStateError("Cannot build a level before a template is set.");
    }
    return this.template;
  }

  private requireStart(): Position {
    if (this.start === undefined) {
      throw new LevelBuildStateError("Cannot build a level before a start position is set.");
    }
    return this.start;
  }
}
