import { GameFacade } from "@/application/facades/GameFacade";
import { manualLevels } from "@/application/level-build/fixtures";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { GameEventType } from "@/application/dto/GameEventDto";
import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { CollisionService } from "@/domain/board/CollisionService";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";
import { GameOverlay } from "@/presentation/state/GameUiState";

// Subject to human review — presentation ViewModel test

const firstLevel = manualLevels[0]!;
const collision = new CollisionService();

function boardFor(definition: LevelDefinition): BoardGroup {
  return new BoardGroup(definition.arrows.map((spec) => new ArrowEntity(spec)));
}

function firstExtractableArrowId(definition: LevelDefinition): string {
  const board = boardFor(definition);
  const arrow = board.activeArrows().find((candidate) => collision.canExtract(board, candidate.id));
  if (arrow === undefined) throw new Error("Fixture has no initially extractable arrow");
  return arrow.id;
}

function firstBlockedArrowId(definition: LevelDefinition): string {
  const board = boardFor(definition);
  const arrow = board.activeArrows().find((candidate) => !collision.canExtract(board, candidate.id));
  if (arrow === undefined) throw new Error("Fixture has no initially blocked arrow");
  return arrow.id;
}

function solutionOrder(definition: LevelDefinition): string[] {
  const board = boardFor(definition);
  const order: string[] = [];

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const arrow of board.activeArrows()) {
      if (collision.canExtract(board, arrow.id)) {
        arrow.extract();
        order.push(arrow.id);
        progressed = true;
      }
    }
  }

  if (board.activeArrowCount() !== 0) throw new Error("Fixture is not fully solvable");
  return order;
}

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
    expect(state.attemptsRemaining).toBe(firstLevel.definition.attempts ?? 5);
    expect(state.overlay).toBe(GameOverlay.None);
  });

  it("should_extract_a_free_arrow_and_track_it_for_undo", () => {
    const viewModel = startedViewModel();
    const freeArrowId = firstExtractableArrowId(firstLevel.definition);

    viewModel.tapArrow(freeArrowId);

    const state = viewModel.getState();
    expect(state.arrowsRemaining).toBe(firstLevel.arrowCount - 1);
    expect(state.extractedArrowIds).toContain(freeArrowId);
    expect(state.canUndo).toBe(true);
    expect(state.shakeArrowId).toBeNull();
  });

  it("should_flag_a_blocked_tap_with_shake_and_cost_one_attempt", () => {
    const viewModel = startedViewModel();
    const blockedArrowId = firstBlockedArrowId(firstLevel.definition);

    viewModel.tapArrow(blockedArrowId);

    const state = viewModel.getState();
    expect(state.arrowsRemaining).toBe(firstLevel.arrowCount);
    expect(state.attemptsRemaining).toBe((firstLevel.definition.attempts ?? 5) - 1);
    expect(state.shakeArrowId).toBe(blockedArrowId);
  });

  it("should_show_victory_when_the_board_is_cleared", () => {
    const viewModel = startedViewModel();

    for (const arrowId of solutionOrder(firstLevel.definition)) {
      viewModel.tapArrow(arrowId);
    }

    expect(viewModel.getState().arrowsRemaining).toBe(0);
    expect(viewModel.getState().overlay).toBe(GameOverlay.Victory);
  });

  it("should_undo_the_last_extraction", () => {
    const viewModel = startedViewModel();
    const freeArrowId = firstExtractableArrowId(firstLevel.definition);

    viewModel.tapArrow(freeArrowId);
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
