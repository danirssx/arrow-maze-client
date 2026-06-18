import { GameFacade } from "@/application/facades/GameFacade";
import { manualLevels } from "@/application/level-build/fixtures";
import { GameEventType } from "@/application/dto/GameEventDto";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";
import { GameOverlay } from "@/presentation/state/GameUiState";

// Subject to human review — presentation ViewModel test

const firstLevel = manualLevels[0]!; // "manual-001-first-knot": "a" is free, "b" is blocked by "a"

function startedViewModel(): GameViewModel {
  const viewModel = new GameViewModel(GameFacade.createDefault());
  viewModel.attach();
  viewModel.startLevel(firstLevel.id, firstLevel.definition);
  return viewModel;
}

describe("GameViewModel", () => {
  it("should_load_board_and_hud_when_level_starts", () => {
    const state = startedViewModel().getState();

    expect(state.levelId).toBe(firstLevel.id);
    expect(state.arrows).toHaveLength(firstLevel.arrowCount);
    expect(state.arrowsRemaining).toBe(firstLevel.arrowCount);
    expect(state.attemptsRemaining).toBe(5);
    expect(state.overlay).toBe(GameOverlay.None);
  });

  it("should_extract_a_free_arrow_and_track_it_for_undo", () => {
    const viewModel = startedViewModel();

    viewModel.tapArrow("a");

    const state = viewModel.getState();
    expect(state.arrowsRemaining).toBe(firstLevel.arrowCount - 1);
    expect(state.extractedArrowIds).toContain("a");
    expect(state.canUndo).toBe(true);
    expect(state.shakeArrowId).toBeNull();
  });

  it("should_flag_a_blocked_tap_with_shake_and_cost_one_attempt", () => {
    const viewModel = startedViewModel();

    viewModel.tapArrow("b");

    const state = viewModel.getState();
    expect(state.arrowsRemaining).toBe(firstLevel.arrowCount);
    expect(state.attemptsRemaining).toBe(4);
    expect(state.shakeArrowId).toBe("b");
  });

  it("should_show_victory_when_the_board_is_cleared", () => {
    const viewModel = startedViewModel();

    viewModel.tapArrow("a");
    viewModel.tapArrow("b");

    expect(viewModel.getState().arrowsRemaining).toBe(0);
    expect(viewModel.getState().overlay).toBe(GameOverlay.Victory);
  });

  it("should_undo_the_last_extraction", () => {
    const viewModel = startedViewModel();

    viewModel.tapArrow("a");
    viewModel.undo();

    const state = viewModel.getState();
    expect(state.arrowsRemaining).toBe(firstLevel.arrowCount);
    expect(state.extractedArrowIds).toHaveLength(0);
    expect(state.canUndo).toBe(false);
  });

  it("should_render_defeat_overlay_on_a_lost_level_finished_event", () => {
    const viewModel = startedViewModel();

    viewModel.onGameEvent({
      type: GameEventType.LevelFinished,
      result: { status: "LOST", reason: "OUT_OF_ATTEMPTS" }
    });

    expect(viewModel.getState().overlay).toBe(GameOverlay.Defeat);
  });
});
