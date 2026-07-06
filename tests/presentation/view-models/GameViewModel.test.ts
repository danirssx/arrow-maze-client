import type { IGameEventListener } from "@/application/dto/IGameEventListener";
import type { BoardSnapshotDto } from "@/application/dto/BoardSnapshotDto";
import type { GameSnapshotDto } from "@/application/use-cases/game/GameSnapshotDto";
import type { ILevelStrategy } from "@/application/level-build/ILevelStrategy";
import { GameEventTypeDto } from "@/application/dto/GameEventDto";
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
  snapshot: GameSnapshotDto = { ...PLAYING_SNAPSHOT };
  board: BoardSnapshotDto = BOARD_SNAPSHOT;

  addEventListener(l: IGameEventListener): void { this.listeners.add(l); }
  removeEventListener(l: IGameEventListener): void { this.listeners.delete(l); }
  startLevel(_strategy: ILevelStrategy): GameSnapshotDto { return this.snapshot; }
  getBoardSnapshot(): BoardSnapshotDto { return this.board; }
  tapArrow(_id: string): GameSnapshotDto { return this.snapshot; }
  undo(): GameSnapshotDto { return { ...this.snapshot, canUndo: false, arrowsRemaining: this.snapshot.arrowsRemaining + 1 }; }
  restartLevel(): GameSnapshotDto { return this.snapshot; }

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

function makeViewModel(fake?: FakeGameFacade): { vm: GameViewModel; fake: FakeGameFacade } {
  const f = fake ?? new FakeGameFacade();
  const vm = new GameViewModel(f as unknown as import("@/application/facades/GameFacade").GameFacade);
  vm.attach();
  return { vm, fake: f };
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
});
