import { GameContext, GamePhase, InvalidGameStateActionError, MissingActiveLevelError } from "@/domain/state";
import { DefeatReason, LevelResult, NormalLevel, TimedLevel } from "@/domain/level";
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

  it("should_throw_controlled_error_when_playing_state_has_no_active_level", () => {
    const context = new GameContext();
    context.restore({
      phase: GamePhase.Playing,
      result: LevelResult.playing()
    });

    expect(() => context.move(Position.of(0, 1))).toThrow(MissingActiveLevelError);
  });

  it("should_restore_snapshot_phase_and_result_when_undo_rehydrates_context", () => {
    const context = new GameContext();

    context.restore({
      phase: GamePhase.GameOver,
      result: LevelResult.lost(DefeatReason.Time)
    });

    expect(context.phase).toBe(GamePhase.GameOver);
    expect(context.result.isLost()).toBe(true);
    expect(context.result.reason).toBe(DefeatReason.Time);
  });

  it("should_restore_all_supported_phases_when_snapshot_is_rehydrated", () => {
    const context = new GameContext();

    for (const phase of [GamePhase.Menu, GamePhase.Paused, GamePhase.Victory]) {
      context.restore({
        phase,
        result: phase === GamePhase.Victory ? LevelResult.won() : LevelResult.playing()
      });

      expect(context.phase).toBe(phase);
    }
  });

  it("should_reject_unsupported_actions_when_state_inherits_base_rejections", () => {
    const context = new GameContext();

    expect(() => context.move(Position.of(0, 1))).toThrow(InvalidGameStateActionError);
    expect(() => context.pause()).toThrow(InvalidGameStateActionError);
    expect(() => context.resume()).toThrow(InvalidGameStateActionError);
  });

  it("should_reject_restart_from_terminal_state_until_application_orchestrates_retry", () => {
    const context = new GameContext();
    context.start(new NormalLevel(buildSolvableTemplate(), Position.of(0, 0)));
    context.move(Position.of(0, 1));
    context.move(Position.of(0, 2));
    context.move(Position.of(1, 2));

    expect(context.phase).toBe(GamePhase.Victory);
    expect(() => context.start(new NormalLevel(buildSolvableTemplate(), Position.of(0, 0)))).toThrow(
      InvalidGameStateActionError
    );
  });
});
