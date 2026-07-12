import type { IGameEventListener } from "@/application/dto/IGameEventListener";
import type { BoardSnapshotDto } from "@/application/dto/BoardSnapshotDto";
import type { GameSnapshotDto } from "@/application/use-cases/game/GameSnapshotDto";
import type { ILevelStrategy } from "@/application/level-build/ILevelStrategy";
import type { GameFacade } from "@/application/facades/GameFacade";
import type { SoundEffectKey } from "@/application/ports/IAudioPlayer";
import { GameEventTypeDto } from "@/application/dto/GameEventDto";
import { GameplayStateError } from "@/application/use-cases/game/errors";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";
import { GameOverlay } from "@/presentation/state/GameUiState";

// Subject to human review — presentation ViewModel test

const PLAYING_SNAPSHOT: GameSnapshotDto = {
  phase: "PLAYING",
  result: { status: "PLAYING" },
  arrowsRemaining: 3,
  attemptsRemaining: 5,
  canUndo: false,
  elapsedMs: 0,
  movesCount: 0,
};

const BOARD_SNAPSHOT: BoardSnapshotDto = {
  arrows: [
    { id: "a1", color: "blue", direction: "RIGHT", cells: [{ row: 0, column: 0 }], head: { row: 0, column: 0 } },
    { id: "a2", color: "red",  direction: "DOWN",  cells: [{ row: 1, column: 0 }], head: { row: 1, column: 0 } },
    { id: "a3", color: "green",direction: "LEFT",  cells: [{ row: 2, column: 0 }], head: { row: 2, column: 0 } },
  ],
  bounds: { minRow: 0, minCol: 0, maxRow: 2, maxCol: 0 },
};

class FakeGameFacade {
  private listeners = new Set<IGameEventListener>();
  private started = false;
  snapshot: GameSnapshotDto = { ...PLAYING_SNAPSHOT };
  board: BoardSnapshotDto = BOARD_SNAPSHOT;

  addEventListener(l: IGameEventListener): void { this.listeners.add(l); }
  removeEventListener(l: IGameEventListener): void { this.listeners.delete(l); }
  startLevel(_strategy: ILevelStrategy): GameSnapshotDto { this.started = true; return this.snapshot; }
  getBoardSnapshot(): BoardSnapshotDto { return this.board; }

  // Mirrors the real facade: reading a snapshot before a level starts throws.
  getSnapshot(): GameSnapshotDto {
    if (!this.started) throw new GameplayStateError("no level started");
    return this.snapshot;
  }

  tapArrow(_id: string): GameSnapshotDto { return this.snapshot; }
  undo(): GameSnapshotDto { return { ...this.snapshot, canUndo: false, arrowsRemaining: this.snapshot.arrowsRemaining + 1 }; }
  restartLevel(): GameSnapshotDto { this.started = true; return this.snapshot; }

  emit(listener: IGameEventListener): void {
    for (const l of this.listeners) l.onGameEvent({ type: GameEventTypeDto.LevelFinished, result: { status: "LOST", reason: "OUT_OF_ATTEMPTS" } });
    void listener;
  }

  emitVictory(): void {
    for (const l of this.listeners) l.onGameEvent({ type: GameEventTypeDto.LevelFinished, result: { status: "WON" } });
  }

  emitDefeat(): void {
    for (const l of this.listeners) l.onGameEvent({ type: GameEventTypeDto.LevelFinished, result: { status: "LOST", reason: "OUT_OF_ATTEMPTS" } });
  }
}

class FakeAudioEffects {
  played: SoundEffectKey[] = [];

  async playEffect(sound: SoundEffectKey): Promise<void> {
    this.played.push(sound);
  }
}

function makeViewModel(fake?: FakeGameFacade, audio?: FakeAudioEffects): { vm: GameViewModel; fake: FakeGameFacade; audio: FakeAudioEffects } {
  const f = fake ?? new FakeGameFacade();
  const a = audio ?? new FakeAudioEffects();
  const vm = new GameViewModel(f as unknown as GameFacade, a);
  vm.attach();
  return { vm, fake: f, audio: a };
}

describe("GameViewModel", () => {
  it("should_load_board_and_hud_when_level_starts", () => {
    const { vm, fake } = makeViewModel();
    fake.snapshot = { ...PLAYING_SNAPSHOT, arrowsRemaining: 3, attemptsRemaining: 5 };

    vm.startLevel("level-1", {} as never);

    const state = vm.getState();
    expect(state.levelId).toBe("level-1");
    expect(state.arrows).toHaveLength(3);
    expect(state.arrowsRemaining).toBe(3);
    expect(state.attemptsRemaining).toBe(5);
    expect(state.overlay).toBe(GameOverlay.None);
  });

  it("should_extract_a_free_arrow_and_track_it_for_undo", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, arrowsRemaining: 2, attemptsRemaining: 5, canUndo: true };

    vm.tapArrow("a1");

    const state = vm.getState();
    expect(state.arrowsRemaining).toBe(2);
    expect(state.extractedArrowIds).toContain("a1");
    expect(state.canUndo).toBe(true);
    expect(state.shakeArrowId).toBeNull();
  });

  it("should_play_move_effect_once_when_an_arrow_is_extracted", () => {
    const { vm, fake, audio } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, arrowsRemaining: 2, attemptsRemaining: 5, canUndo: true };

    vm.tapArrow("a1");

    expect(audio.played).toEqual(["move"]);
  });

  it("should_flag_a_blocked_tap_with_shake_when_arrowsRemaining_is_unchanged", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, arrowsRemaining: 3, attemptsRemaining: 4 };

    vm.tapArrow("a2");

    const state = vm.getState();
    expect(state.arrowsRemaining).toBe(3);
    expect(state.shakeArrowId).toBe("a2");
  });

  it("should_show_victory_overlay_on_victory_event", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);

    fake.emitVictory();

    expect(vm.getState().overlay).toBe(GameOverlay.Victory);
  });

  it("should_show_defeat_overlay_on_defeat_event", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);

    fake.emitDefeat();

    expect(vm.getState().overlay).toBe(GameOverlay.Defeat);
  });

  it("should_undo_the_last_extraction", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, arrowsRemaining: 2, canUndo: true };
    vm.tapArrow("a1");

    vm.undo();

    const state = vm.getState();
    expect(state.extractedArrowIds).toHaveLength(0);
    expect(state.canUndo).toBe(false);
  });

  it("should_play_undo_effect_once_when_undo_restores_an_arrow", () => {
    const { vm, fake, audio } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, arrowsRemaining: 2, canUndo: true };
    vm.tapArrow("a1");
    audio.played = [];

    vm.undo();

    expect(audio.played).toEqual(["undo"]);
  });

  it("should_carry_board_shape_into_ui_state_when_the_level_has_one", () => {
    const { vm, fake } = makeViewModel();
    fake.board = {
      ...BOARD_SNAPSHOT,
      boardShape: [{ row: 0, column: 0 }, { row: 0, column: 1 }],
    };

    vm.startLevel("shaped", {} as never);

    expect(vm.getState().boardShape).toHaveLength(2);
    expect(vm.getState().boardShape![0]).toEqual({ row: 0, column: 0 });
  });

  it("should_not_expose_scoring_or_progress_metric_sources", () => {
    const { vm } = makeViewModel();
    const record = vm as unknown as Record<string, unknown>;
    expect(record.elapsedMs).toBeUndefined();
    expect(record.movesCount).toBeUndefined();
  });

  it("should_render_defeat_overlay_on_a_lost_level_finished_event", () => {
    const { vm } = makeViewModel();
    vm.startLevel("level-1", {} as never);

    vm.onGameEvent({ type: GameEventTypeDto.LevelFinished, result: { status: "LOST", reason: "OUT_OF_ATTEMPTS" } });

    expect(vm.getState().overlay).toBe(GameOverlay.Defeat);
  });

  it("should_play_terminal_effect_once_when_level_finished_event_repeats", () => {
    const { vm, fake, audio } = makeViewModel();
    vm.startLevel("level-1", {} as never);

    fake.emitVictory();
    fake.emitVictory();
    fake.emitDefeat();

    expect(audio.played).toEqual(["victory"]);
  });

  // Covers @s1 of specs/gameplay-visible-timer-MAZ-220.feature
  it("should_start_the_visible_timer_at_zero_when_level_starts", () => {
    const { vm, fake } = makeViewModel();
    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 0 };

    vm.startLevel("level-1", {} as never);

    expect(vm.getState().elapsedMs).toBe(0);
  });

  it("should_publish_the_application_elapsed_time_when_refresh_is_requested", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 4_200 };

    vm.refreshElapsedTime();

    expect(vm.getState().elapsedMs).toBe(4_200);
  });

  it("should_not_publish_state_when_the_elapsed_time_is_unchanged", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 4_200 };
    vm.refreshElapsedTime();

    const notify = jest.fn();
    vm.subscribe(notify);
    vm.refreshElapsedTime();

    expect(notify).not.toHaveBeenCalled();
  });

  it("should_carry_the_elapsed_time_when_an_arrow_is_tapped", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, arrowsRemaining: 2, canUndo: true, elapsedMs: 1_500 };

    vm.tapArrow("a1");

    expect(vm.getState().elapsedMs).toBe(1_500);
  });

  // Covers @s2 of specs/gameplay-visible-timer-MAZ-220.feature
  it("should_freeze_the_visible_timer_when_the_level_finishes", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 9_000 };

    fake.emitVictory();
    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 9_000 };
    vm.refreshElapsedTime();

    expect(vm.getState().overlay).toBe(GameOverlay.Victory);
    expect(vm.getState().elapsedMs).toBe(9_000);
  });

  it("should_publish_the_frozen_elapsed_time_when_the_level_finished_event_arrives", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 12_345 };

    fake.emitVictory();

    expect(vm.getState().elapsedMs).toBe(12_345);
  });

  // Covers @s3 of specs/gameplay-visible-timer-MAZ-220.feature
  it("should_reset_the_visible_timer_when_the_level_restarts", () => {
    const { vm, fake } = makeViewModel();
    vm.startLevel("level-1", {} as never);
    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 30_000 };
    vm.refreshElapsedTime();

    fake.snapshot = { ...PLAYING_SNAPSHOT, elapsedMs: 0 };
    vm.restart();

    expect(vm.getState().elapsedMs).toBe(0);
  });

  // Covers @s6 of specs/gameplay-visible-timer-MAZ-220.feature
  it("should_not_publish_state_when_refresh_runs_before_a_level_starts", () => {
    const { vm } = makeViewModel();
    const notify = jest.fn();
    vm.subscribe(notify);

    expect(() => vm.refreshElapsedTime()).not.toThrow();
    expect(notify).not.toHaveBeenCalled();
    expect(vm.getState().elapsedMs).toBe(0);
  });
});
