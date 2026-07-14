import { ConcreteLevelBuilder } from "@/application/level-build/ConcreteLevelBuilder";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { LevelDirector } from "@/application/level-build/LevelDirector";
import { manualLevels } from "@/application/level-build/fixtures";
import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { CollisionService } from "@/domain/board/CollisionService";
import { Difficulty } from "@/domain/value-objects/Difficulty";

const DIFFICULTY_RANK: Record<string, number> = {
  [Difficulty.Easy]: 0,
  [Difficulty.Medium]: 1,
  [Difficulty.Hard]: 2
};

/**
 * Greedy solver: repeatedly extract every currently-unblocked arrow. Because a
 * removal only ever frees cells, this empties the board if and only if the
 * blocking graph is acyclic (i.e. the level is solvable).
 */
function clearsCompletely(definition: LevelDefinition): boolean {
  const board = new BoardGroup(definition.arrows.map((spec) => new ArrowEntity(spec)));
  const collision = new CollisionService();

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const arrow of board.activeArrows()) {
      if (collision.canExtract(board, arrow.id)) {
        arrow.extract();
        progressed = true;
      }
    }
  }

  return board.activeArrowCount() === 0;
}

describe("manual level fixtures", () => {
  it("should_provide_levels_with_unique_ids_in_order", () => {
    expect(manualLevels.map((level) => level.order)).toEqual(
      Array.from({ length: manualLevels.length }, (_, index) => index + 1)
    );
    expect(new Set(manualLevels.map((level) => level.id)).size).toBe(manualLevels.length);
  });

  it("should_progress_in_difficulty_and_arrow_count_for_2d_levels", () => {
    // 3-D levels are a different kind and are excluded from the 2-D progression check.
    const levels2D = manualLevels.filter((level) => level.definition.dimensions !== 3);
    const ranks = levels2D.map((level) => DIFFICULTY_RANK[level.difficulty] ?? 0);
    const counts = levels2D.map((level) => level.arrowCount);

    for (let index = 1; index < levels2D.length; index += 1) {
      expect(ranks[index] ?? 0).toBeGreaterThanOrEqual(ranks[index - 1] ?? 0);
      expect(counts[index] ?? 0).toBeGreaterThanOrEqual(counts[index - 1] ?? 0);
    }
  });

  it.each(manualLevels)("should_build_$id_via_the_director", (fixture) => {
    const built = new LevelDirector(new ConcreteLevelBuilder()).construct({
      createDefinition: () => fixture.definition
    });

    expect(built.level.id).toBe(fixture.id);
    expect(built.level.activeArrowCount).toBe(fixture.arrowCount);
  });

  it.each(manualLevels)("should_be_fully_solvable_$id", (fixture) => {
    expect(clearsCompletely(fixture.definition)).toBe(true);
  });
});
