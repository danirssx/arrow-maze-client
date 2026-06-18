import { GameFacade, GameplayStateError } from "@/application/facades";
import { TutorialLevelStrategy } from "@/application/level-build";
import { EmptyCommandHistoryError } from "@/domain/command";
import { IllegalMoveError } from "@/domain/level";
import { LevelStatus } from "@/domain/level/LevelResult";
import { GamePhase } from "@/domain/state";

function startTutorialFacade(): GameFacade {
  const facade = GameFacade.createDefault();
  facade.startLevel(new TutorialLevelStrategy());
  return facade;
}

describe("GameFacade", () => {
  it("should_start_level_and_return_observable_snapshot_when_strategy_builds_level", () => {
    const facade = GameFacade.createDefault();

    const snapshot = facade.startLevel(new TutorialLevelStrategy());

    expect(snapshot).toEqual({
      phase: GamePhase.Playing,
      result: { status: LevelStatus.Playing },
      position: { row: 0, column: 0 },
      moves: 0,
      canUndo: false,
      optimalMoves: 2
    });
  });

  it("should_play_turn_with_graph_validated_command_and_return_snapshot", () => {
    const facade = startTutorialFacade();

    const snapshot = facade.playTurn({ row: 0, column: 1 });

    expect(snapshot.phase).toBe(GamePhase.Playing);
    expect(snapshot.result.status).toBe(LevelStatus.Playing);
    expect(snapshot.position).toEqual({ row: 0, column: 1 });
    expect(snapshot.moves).toBe(1);
    expect(snapshot.canUndo).toBe(true);
    expect(snapshot.optimalMoves).toBe(2);
  });

  it("should_reject_turn_when_destination_is_not_connected_by_graph", () => {
    const facade = startTutorialFacade();

    expect(() => facade.playTurn({ row: 1, column: 1 })).toThrow(IllegalMoveError);
    expect(facade.getSnapshot().position).toEqual({ row: 0, column: 0 });
    expect(facade.getSnapshot().canUndo).toBe(false);
  });

  it("should_restore_observable_snapshot_when_undoing_last_move", () => {
    const facade = startTutorialFacade();
    facade.playTurn({ row: 0, column: 1 });

    const snapshot = facade.undoMove();

    expect(snapshot.phase).toBe(GamePhase.Playing);
    expect(snapshot.result.status).toBe(LevelStatus.Playing);
    expect(snapshot.position).toEqual({ row: 0, column: 0 });
    expect(snapshot.moves).toBe(0);
    expect(snapshot.canUndo).toBe(false);
  });

  it("should_restore_playing_snapshot_when_undoing_winning_move", () => {
    const facade = startTutorialFacade();
    facade.playTurn({ row: 0, column: 1 });
    facade.playTurn({ row: 0, column: 2 });

    expect(facade.getSnapshot().phase).toBe(GamePhase.Victory);
    expect(facade.getSnapshot().result.status).toBe(LevelStatus.Won);

    const snapshot = facade.undoMove();

    expect(snapshot.phase).toBe(GamePhase.Playing);
    expect(snapshot.result.status).toBe(LevelStatus.Playing);
    expect(snapshot.position).toEqual({ row: 0, column: 1 });
    expect(snapshot.moves).toBe(1);
    expect(snapshot.canUndo).toBe(true);
  });

  it("should_pause_and_resume_game_when_session_is_playing", () => {
    const facade = startTutorialFacade();

    expect(facade.pauseGame().phase).toBe(GamePhase.Paused);
    expect(facade.resumeGame().phase).toBe(GamePhase.Playing);
  });

  it("should_restart_level_and_clear_command_history_when_requested", () => {
    const facade = startTutorialFacade();
    facade.playTurn({ row: 0, column: 1 });

    const snapshot = facade.restartLevel();

    expect(snapshot.phase).toBe(GamePhase.Playing);
    expect(snapshot.position).toEqual({ row: 0, column: 0 });
    expect(snapshot.moves).toBe(0);
    expect(snapshot.canUndo).toBe(false);
  });

  it("should_throw_controlled_error_when_snapshot_is_requested_before_start", () => {
    const facade = GameFacade.createDefault();

    expect(() => facade.getSnapshot()).toThrow(GameplayStateError);
  });

  it("should_throw_controlled_error_when_undo_is_requested_without_history", () => {
    const facade = startTutorialFacade();

    expect(() => facade.undoMove()).toThrow(EmptyCommandHistoryError);
  });
});
