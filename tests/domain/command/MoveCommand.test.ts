import { CommandAlreadyExecutedError, CommandHistory, CommandNotExecutedError, EmptyCommandHistoryError, MoveCommand } from "@/domain/command";
import { IllegalMoveError, NormalLevel } from "@/domain/level";
import { GameContext, GamePhase } from "@/domain/state";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

function buildSolvableTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "command-level",
    rows: 2,
    cols: 3,
    difficulty: Difficulty.Easy,
    cells: [
      CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
      CellSpec.of(Position.of(0, 1), CellType.Empty),
      CellSpec.of(Position.of(0, 2), CellType.Empty),
      CellSpec.of(Position.of(1, 1), CellType.Wall),
      CellSpec.of(Position.of(1, 2), CellType.Exit)
    ]
  });
}

function startContext(): GameContext {
  const context = new GameContext();
  context.start(new NormalLevel(buildSolvableTemplate(), Position.of(0, 0)));
  return context;
}

describe("MoveCommand and CommandHistory (Command pattern)", () => {
  it("should_execute_and_record_move_when_destination_is_connected_by_graph", () => {
    const context = startContext();
    const history = new CommandHistory();

    const result = history.execute(new MoveCommand(context, Position.of(0, 1)));

    expect(result.isPlaying()).toBe(true);
    expect(context.level?.position.equals(Position.of(0, 1))).toBe(true);
    expect(context.level?.moves).toBe(1);
    expect(history.size).toBe(1);
    expect(history.canUndo).toBe(true);
  });

  it("should_not_record_move_when_destination_is_not_connected_by_graph", () => {
    const context = startContext();
    const history = new CommandHistory();

    expect(() => history.execute(new MoveCommand(context, Position.of(1, 2)))).toThrow(IllegalMoveError);
    expect(context.level?.position.equals(Position.of(0, 0))).toBe(true);
    expect(context.level?.moves).toBe(0);
    expect(history.size).toBe(0);
  });

  it("should_restore_position_move_count_phase_and_result_when_undoing_last_move", () => {
    const context = startContext();
    const history = new CommandHistory();

    history.execute(new MoveCommand(context, Position.of(0, 1)));
    history.undoLast();

    expect(context.level?.position.equals(Position.of(0, 0))).toBe(true);
    expect(context.level?.moves).toBe(0);
    expect(context.phase).toBe(GamePhase.Playing);
    expect(context.result.isPlaying()).toBe(true);
    expect(history.canUndo).toBe(false);
  });

  it("should_restore_playing_state_when_undoing_winning_move", () => {
    const context = startContext();
    const history = new CommandHistory();

    history.execute(new MoveCommand(context, Position.of(0, 1)));
    history.execute(new MoveCommand(context, Position.of(0, 2)));
    history.execute(new MoveCommand(context, Position.of(1, 2)));

    expect(context.phase).toBe(GamePhase.Victory);
    expect(context.result.isWon()).toBe(true);

    history.undoLast();

    expect(context.level?.position.equals(Position.of(0, 2))).toBe(true);
    expect(context.level?.moves).toBe(2);
    expect(context.phase).toBe(GamePhase.Playing);
    expect(context.result.isPlaying()).toBe(true);
  });

  it("should_throw_controlled_error_when_undo_history_is_empty", () => {
    const history = new CommandHistory();

    expect(() => history.undoLast()).toThrow(EmptyCommandHistoryError);
  });

  it("should_throw_controlled_error_when_command_is_executed_twice", () => {
    const context = startContext();
    const command = new MoveCommand(context, Position.of(0, 1));

    command.execute();

    expect(() => command.execute()).toThrow(CommandAlreadyExecutedError);
  });

  it("should_throw_controlled_error_when_command_is_undone_before_execution", () => {
    const context = startContext();
    const command = new MoveCommand(context, Position.of(0, 1));

    expect(() => command.undo()).toThrow(CommandNotExecutedError);
  });
});
