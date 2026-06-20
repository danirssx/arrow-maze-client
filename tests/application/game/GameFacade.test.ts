import { GameFacade } from "@/application/facades/GameFacade";
import { TutorialLevelStrategy } from "@/application/level-build/TutorialLevelStrategy";
import { GameplayStateError } from "@/application/use-cases/game/errors";
import { GamePhase } from "@/domain/state/GamePhase";

describe("GameFacade", () => {
  it("should_start_the_tutorial_with_two_arrows_and_default_attempts", () => {
    const facade = GameFacade.createDefault();

    const snapshot = facade.startLevel(new TutorialLevelStrategy());

    expect(snapshot.phase).toBe(GamePhase.Playing);
    expect(snapshot.arrowsRemaining).toBe(2);
    expect(snapshot.attemptsRemaining).toBe(5);
  });

  it("should_cost_an_attempt_for_a_blocked_tap_and_win_after_clearing_the_blocker", () => {
    const facade = GameFacade.createDefault();
    facade.startLevel(new TutorialLevelStrategy());

    // "a" (Right) is blocked by "b" sitting on its ray -> failed tap costs one attempt.
    const afterBlocked = facade.tapArrow("a");
    expect(afterBlocked.attemptsRemaining).toBe(4);
    expect(afterBlocked.arrowsRemaining).toBe(2);

    facade.tapArrow("b"); // clear the blocker
    const final = facade.tapArrow("a"); // now extractable -> empties the board

    expect(final.arrowsRemaining).toBe(0);
    expect(final.phase).toBe(GamePhase.Victory);
  });

  it("should_undo_the_last_extraction", () => {
    const facade = GameFacade.createDefault();
    facade.startLevel(new TutorialLevelStrategy());

    facade.tapArrow("b"); // extract b
    const afterUndo = facade.undo();

    expect(afterUndo.arrowsRemaining).toBe(2);
    expect(afterUndo.canUndo).toBe(false);
  });

  it("should_throw_when_tapping_before_a_level_starts", () => {
    expect(() => GameFacade.createDefault().tapArrow("a")).toThrow(GameplayStateError);
  });
});
