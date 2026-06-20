import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { ExtractArrowCommand } from "@/domain/command/ExtractArrowCommand";
import { CommandAlreadyExecutedError, CommandNotExecutedError } from "@/domain/command/errors";
import { NormalLevel } from "@/domain/level/NormalLevel";
import { GameContext } from "@/domain/state/GameContext";
import { GamePhase } from "@/domain/state/GamePhase";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

const startedContext = (board: BoardGroup, attempts = 3): GameContext => {
  const context = new GameContext();
  context.start(new NormalLevel("L", board, attempts));
  return context;
};

describe("ExtractArrowCommand", () => {
  it("should_extract_the_arrow_when_executed", () => {
    const board = new BoardGroup([arrow("a", [[0, 0], [0, 1]], Direction.Right), arrow("b", [[3, 3]], Direction.Up)]);
    const context = startedContext(board);

    const result = new ExtractArrowCommand(context, "a").execute();

    expect(result.isPlaying()).toBe(true);
    expect(board.get("a")?.isActive).toBe(false);
  });

  it("should_restore_the_arrow_and_phase_on_undo", () => {
    const board = new BoardGroup([arrow("a", [[0, 0], [0, 1]], Direction.Right)]);
    const context = startedContext(board);
    const command = new ExtractArrowCommand(context, "a");

    command.execute();
    expect(context.phase).toBe(GamePhase.Victory);

    command.undo();

    expect(board.get("a")?.isActive).toBe(true);
    expect(context.phase).toBe(GamePhase.Playing);
  });

  it("should_throw_when_executed_twice", () => {
    const board = new BoardGroup([arrow("a", [[0, 0], [0, 1]], Direction.Right)]);
    const command = new ExtractArrowCommand(startedContext(board), "a");

    command.execute();

    expect(() => command.execute()).toThrow(CommandAlreadyExecutedError);
  });

  it("should_throw_when_undone_before_execution", () => {
    const board = new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]);

    expect(() => new ExtractArrowCommand(startedContext(board), "a").undo()).toThrow(CommandNotExecutedError);
  });
});
