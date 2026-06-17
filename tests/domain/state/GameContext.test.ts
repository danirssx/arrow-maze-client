import { GameContext, GamePhase, InvalidGameStateActionError } from "@/domain/state";
import { NormalLevel, TimedLevel } from "@/domain/level";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

function buildSolvableTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "state-level",
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

describe("GameContext (State pattern)", () => {
  it("should_transition_to_playing_when_level_starts_from_menu", () => {
    const context = new GameContext();

    context.start(new NormalLevel(buildSolvableTemplate(), Position.of(0, 0)));

    expect(context.phase).toBe(GamePhase.Playing);
    expect(context.result.isPlaying()).toBe(true);
    expect(context.level?.position.equals(Position.of(0, 0))).toBe(true);
  });

  it("should_reject_move_when_game_is_paused", () => {
    const context = new GameContext();
    context.start(new NormalLevel(buildSolvableTemplate(), Position.of(0, 0)));
    context.pause();

    expect(context.phase).toBe(GamePhase.Paused);
    expect(() => context.move(Position.of(0, 1))).toThrow(InvalidGameStateActionError);
    expect(context.level?.position.equals(Position.of(0, 0))).toBe(true);
  });

  it("should_resume_playing_when_game_is_paused", () => {
    const context = new GameContext();
    context.start(new NormalLevel(buildSolvableTemplate(), Position.of(0, 0)));
    context.pause();

    context.resume();

    expect(context.phase).toBe(GamePhase.Playing);
    expect(context.move(Position.of(0, 1)).isPlaying()).toBe(true);
  });

  it("should_transition_to_victory_when_level_is_won", () => {
    const context = new GameContext();
    context.start(new NormalLevel(buildSolvableTemplate(), Position.of(0, 0)));

    context.move(Position.of(0, 1));
    context.move(Position.of(0, 2));
    const result = context.move(Position.of(1, 2));

    expect(result.isWon()).toBe(true);
    expect(context.result.isWon()).toBe(true);
    expect(context.phase).toBe(GamePhase.Victory);
  });

  it("should_transition_to_game_over_when_level_is_lost", () => {
    let now = 0;
    const context = new GameContext();
    context.start(new TimedLevel(buildSolvableTemplate(), Position.of(0, 0), 1, { clock: () => now }));
    now = 1000;

    const result = context.move(Position.of(0, 1));

    expect(result.isLost()).toBe(true);
    expect(context.phase).toBe(GamePhase.GameOver);
  });
});
