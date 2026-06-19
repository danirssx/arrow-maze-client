import { fireEvent, render } from "@testing-library/react-native";
import type { ArrowDto } from "@/application/dto/BoardSnapshotDto";
import { BoardView } from "@/presentation/components/BoardView";
import { GameOverlay, initialGameUiState } from "@/presentation/state/GameUiState";
import type { GameUiState } from "@/presentation/state/GameUiState";

// Subject to human review — presentation component test

const arrowA: ArrowDto = {
  id: "a",
  color: "blue",
  direction: "RIGHT",
  cells: [
    { row: 0, column: 0 },
    { row: 0, column: 1 }
  ],
  head: { row: 0, column: 1 }
};

const arrowB: ArrowDto = {
  id: "b",
  color: "green",
  direction: "DOWN",
  cells: [
    { row: 2, column: 2 },
    { row: 3, column: 2 }
  ],
  head: { row: 3, column: 2 }
};

function stateWith(overrides: Partial<GameUiState>): GameUiState {
  return {
    ...initialGameUiState,
    arrows: [arrowA, arrowB],
    bounds: { minRow: 0, minCol: 0, maxRow: 3, maxCol: 2 },
    arrowsRemaining: 2,
    attemptsRemaining: 3,
    overlay: GameOverlay.None,
    ...overrides
  };
}

describe("BoardView", () => {
  it("should_render_a_head_tap_target_for_each_active_arrow", () => {
    const { getByTestId } = render(<BoardView state={stateWith({})} onArrowTap={jest.fn()} />);

    expect(getByTestId("board-view")).toBeTruthy();
    expect(getByTestId("arrow-a")).toBeTruthy();
    expect(getByTestId("arrow-b")).toBeTruthy();
  });

  it("should_report_the_arrow_id_upward_when_its_head_is_tapped", () => {
    const onArrowTap = jest.fn();

    const { getByTestId } = render(<BoardView state={stateWith({})} onArrowTap={onArrowTap} />);
    fireEvent.press(getByTestId("arrow-a"));

    expect(onArrowTap).toHaveBeenCalledWith("a");
  });

  it("should_drop_the_active_tap_target_when_an_arrow_is_extracted", () => {
    const { queryByTestId, rerender } = render(<BoardView state={stateWith({})} onArrowTap={jest.fn()} />);
    expect(queryByTestId("arrow-a")).toBeTruthy();

    rerender(
      <BoardView state={stateWith({ extractedArrowIds: ["a"], arrowsRemaining: 1 })} onArrowTap={jest.fn()} />
    );

    // 'a' left the active set and streamed off (the exit animation completes
    // synchronously under the Reanimated mock), so its active tap target is gone
    // while 'b' stays tappable.
    expect(queryByTestId("arrow-a")).toBeNull();
    expect(queryByTestId("arrow-b")).toBeTruthy();
  });

  it("should_keep_rendering_an_arrow_when_it_is_flagged_for_shake_feedback", () => {
    const { getByTestId } = render(<BoardView state={stateWith({ shakeArrowId: "b" })} onArrowTap={jest.fn()} />);

    expect(getByTestId("arrow-b")).toBeTruthy();
  });

  it("should_render_an_empty_board_without_tap_targets_when_bounds_are_null", () => {
    const { getByTestId, queryByTestId } = render(
      <BoardView state={stateWith({ arrows: [], bounds: null })} onArrowTap={jest.fn()} />
    );

    expect(getByTestId("board-view")).toBeTruthy();
    expect(queryByTestId("arrow-a")).toBeNull();
  });
});
