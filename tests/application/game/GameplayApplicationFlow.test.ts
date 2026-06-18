import { GameFacade, GameplayStateError } from "@/application/facades";
import {
  InvalidLevelDefinitionError,
  JsonLevelStrategy,
  LevelKind,
  TutorialLevelStrategy,
  UnsolvableLevelError
} from "@/application/level-build";
import type { ILevelStrategy, LevelDefinition } from "@/application/level-build";
import { manualLevels } from "@/application/level-build/fixtures";
import { BoardGraphBuilder, BoardGroup, PathfindingService } from "@/domain/board";
import { CellFactory } from "@/domain/factory";
import { IllegalMoveError, LevelResult, LevelStatus } from "@/domain/level";
import { EfficiencyScoringStrategy, ScoreContext } from "@/domain/scoring";
import { GamePhase } from "@/domain/state";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

function strategyFor(definition: LevelDefinition): ILevelStrategy {
  return { createDefinition: () => definition };
}

/** Winning move sequence (positions after the start) derived from the board graph. */
function winningMovesFor(definition: LevelDefinition): Position[] {
  const board = new BoardGroup(definition.template.cells.map((spec) => new CellFactory().create(spec)));
  const graph = new BoardGraphBuilder().build(board, definition.template.rows, definition.template.cols);
  const exit = definition.template.cells.find((spec) => spec.type === CellType.Exit);
  if (exit === undefined) {
    throw new Error(`Fixture ${definition.template.id} has no exit.`);
  }
  const path = new PathfindingService().shortestPath(graph, definition.start, exit.position);
  if (path === undefined) {
    throw new Error(`Fixture ${definition.template.id} is not solvable.`);
  }
  return [...path.slice(1)];
}

function unsolvableDefinition(): LevelDefinition {
  return {
    template: LevelTemplate.create({
      id: "unsolvable",
      rows: 1,
      cols: 3,
      difficulty: Difficulty.Easy,
      cells: [
        CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Left),
        CellSpec.of(Position.of(0, 1), CellType.Wall),
        CellSpec.of(Position.of(0, 2), CellType.Exit)
      ]
    }),
    start: Position.of(0, 0),
    kind: LevelKind.Normal
  };
}

describe("Gameplay application flow over manual fixtures", () => {
  it.each(manualLevels)(
    "should_return_victory_with_score_when_winning_sequence_is_played_on_$id",
    (fixture) => {
      const facade = GameFacade.createDefault();
      facade.startLevel(strategyFor(fixture.definition));

      let snapshot = facade.getSnapshot();
      for (const move of winningMovesFor(fixture.definition)) {
        snapshot = facade.playTurn({ row: move.row, column: move.col });
      }

      expect(snapshot.phase).toBe(GamePhase.Victory);
      expect(snapshot.result.status).toBe(LevelStatus.Won);
      expect(snapshot.moves).toBe(fixture.expectedOptimalMoves);
      expect(snapshot.optimalMoves).toBe(fixture.expectedOptimalMoves);

      const score = new EfficiencyScoringStrategy().score(
        ScoreContext.create({
          result: LevelResult.won(),
          moves: snapshot.moves,
          optimalMoves: snapshot.optimalMoves
        })
      );
      expect(score.value).toBeGreaterThan(0);
    }
  );

  it("should_award_the_efficiency_bonus_when_the_optimal_path_is_played", () => {
    const [fixture] = manualLevels;
    if (fixture === undefined) {
      throw new Error("Expected at least one manual level fixture.");
    }

    const facade = GameFacade.createDefault();
    facade.startLevel(strategyFor(fixture.definition));
    let snapshot = facade.getSnapshot();
    for (const move of winningMovesFor(fixture.definition)) {
      snapshot = facade.playTurn({ row: move.row, column: move.col });
    }

    const score = new EfficiencyScoringStrategy().score(
      ScoreContext.create({
        result: LevelResult.won(),
        moves: snapshot.moves,
        optimalMoves: snapshot.optimalMoves
      })
    );
    // Optimal path: base 1000 + efficiency bonus 500, no penalty.
    expect(score.value).toBe(1500);
  });
});

describe("Gameplay application error handling", () => {
  it("should_throw_controlled_error_when_playing_a_turn_before_a_level_starts", () => {
    expect(() => GameFacade.createDefault().playTurn({ row: 0, column: 0 })).toThrow(GameplayStateError);
  });

  it("should_throw_controlled_error_when_pausing_before_a_level_starts", () => {
    expect(() => GameFacade.createDefault().pauseGame()).toThrow(GameplayStateError);
  });

  it("should_surface_unsolvable_level_error_when_strategy_has_no_path", () => {
    const facade = GameFacade.createDefault();

    expect(() => facade.startLevel(strategyFor(unsolvableDefinition()))).toThrow(UnsolvableLevelError);
  });

  it("should_surface_invalid_definition_error_when_json_strategy_is_malformed", () => {
    const facade = GameFacade.createDefault();

    expect(() => facade.startLevel(new JsonLevelStrategy("{ broken"))).toThrow(InvalidLevelDefinitionError);
  });

  it("should_reject_a_turn_that_is_not_connected_by_the_graph", () => {
    const facade = GameFacade.createDefault();
    facade.startLevel(new TutorialLevelStrategy());

    expect(() => facade.playTurn({ row: 5, column: 5 })).toThrow(IllegalMoveError);
    expect(facade.getSnapshot().position).toEqual({ row: 0, column: 0 });
  });
});
