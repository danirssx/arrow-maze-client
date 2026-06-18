import { GameFacade } from "@/application/facades/GameFacade";
import { manualLevels } from "@/application/level-build/fixtures";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { BoardGraphBuilder, BoardGroup, PathfindingService } from "@/domain/board";
import { CellFactory } from "@/domain/factory";
import { CellType } from "@/domain/value-objects/CellType";
import type { Position } from "@/domain/value-objects/Position";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";
import { GameEventType } from "@/application/dto/GameEventDto";
import { GameOverlay } from "@/presentation/state/GameUiState";

// Subject to human review — presentation ViewModel test

const firstLevel = manualLevels[0]!;

/** Winning move sequence (positions after the start) derived from the board graph. */
function winningMovesFor(definition: LevelDefinition): Position[] {
  const board = new BoardGroup(definition.template.cells.map((spec) => new CellFactory().create(spec)));
  const graph = new BoardGraphBuilder().build(board, definition.template.rows, definition.template.cols);
  const exit = definition.template.cells.find((spec) => spec.type === CellType.Exit)!;
  const path = new PathfindingService().shortestPath(graph, definition.start, exit.position)!;
  return [...path.slice(1)];
}

function startedViewModel(): GameViewModel {
  const viewModel = new GameViewModel(GameFacade.createDefault());
  viewModel.attach();
  viewModel.startLevel(firstLevel.id, firstLevel.definition);
  return viewModel;
}

describe("GameViewModel", () => {
  it("should_place_player_at_start_when_level_starts", () => {
    const viewModel = startedViewModel();

    const state = viewModel.getState();
    expect(state.levelId).toBe(firstLevel.id);
    expect(state.rows).toBe(firstLevel.definition.template.rows);
    expect(state.cols).toBe(firstLevel.definition.template.cols);
    expect(state.playerPosition).toEqual({
      row: firstLevel.definition.start.row,
      column: firstLevel.definition.start.col
    });
    expect(state.moves).toBe(0);
    expect(state.overlay).toBe(GameOverlay.None);
  });

  it("should_advance_player_and_count_moves_when_turn_is_played", () => {
    const viewModel = startedViewModel();
    const [firstMove] = winningMovesFor(firstLevel.definition);

    viewModel.playTurn({ row: firstMove!.row, column: firstMove!.col });

    expect(viewModel.getState().moves).toBe(1);
    expect(viewModel.getState().canUndo).toBe(true);
  });

  it("should_render_victory_overlay_when_winning_sequence_finishes_level", () => {
    const viewModel = startedViewModel();

    for (const move of winningMovesFor(firstLevel.definition)) {
      viewModel.playTurn({ row: move.row, column: move.col });
    }

    expect(viewModel.getState().overlay).toBe(GameOverlay.Victory);
  });

  it("should_render_defeat_overlay_when_level_finished_event_is_lost", () => {
    const viewModel = startedViewModel();

    viewModel.onGameEvent({
      type: GameEventType.LevelFinished,
      result: { status: "LOST", reason: "TIME" }
    });

    expect(viewModel.getState().overlay).toBe(GameOverlay.Defeat);
  });

  it("should_keep_state_and_flag_invalid_move_when_turn_is_illegal", () => {
    const viewModel = startedViewModel();

    viewModel.playTurn({ row: 1, column: 2 });

    expect(viewModel.getState().moves).toBe(0);
    expect(viewModel.getState().invalidMoveAt).toEqual({ row: 1, column: 2 });
  });
});
