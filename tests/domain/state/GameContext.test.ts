import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { NormalLevel } from "@/domain/level/NormalLevel";
import type { BaseLevel } from "@/domain/level/BaseLevel";
import { GameContext } from "@/domain/state/GameContext";
import { GamePhase } from "@/domain/state/GamePhase";
import { InvalidGameStateActionError } from "@/domain/state/errors";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

const startedContext = (level: BaseLevel): GameContext => {
  const context = new GameContext();
  context.start(level);
  return context;
};

describe("GameContext", () => {
  it("should_transition_to_victory_when_the_last_arrow_is_extracted", () => {
    const level = new NormalLevel("L", new BoardGroup([arrow("a", [[0, 0], [0, 1]], Direction.Right)]), 3);
    const context = startedContext(level);
    expect(context.phase).toBe(GamePhase.Playing);

    const result = context.extract("a");

    expect(result.isWon()).toBe(true);
    expect(context.phase).toBe(GamePhase.Victory);
  });

  it("should_transition_to_game_over_when_attempts_are_exhausted", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right);
    const b = arrow("b", [[0, 2]], Direction.Up);
    const context = startedContext(new NormalLevel("L", new BoardGroup([a, b]), 1));

    const result = context.failAttempt("a");

    expect(result.isLost()).toBe(true);
    expect(context.phase).toBe(GamePhase.GameOver);
  });

  it("should_reject_extraction_before_a_level_starts", () => {
    const context = new GameContext();

    expect(() => context.extract("a")).toThrow(InvalidGameStateActionError);
  });

  it("should_pause_and_resume", () => {
    const context = startedContext(new NormalLevel("L", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3));

    context.pause();
    expect(context.phase).toBe(GamePhase.Paused);
    context.resume();
    expect(context.phase).toBe(GamePhase.Playing);
  });
});
