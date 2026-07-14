import { act, render } from "@testing-library/react-native";
import type { ArrowDto } from "@/application/dto/BoardSnapshotDto";
import { BoardView3D } from "@/presentation/components/board3d/BoardView3D";
import { GameOverlay, initialGameUiState } from "@/presentation/state/GameUiState";
import type { GameUiState } from "@/presentation/state/GameUiState";

// Subject to human review — unit tests for C8: exit fly+fade and shake

const bounds = { minRow: 0, minCol: 0, maxRow: 1, maxCol: 1, minZ: 0, maxZ: 1 };

const arrowA: ArrowDto = {
  id: "a",
  color: "cyan",
  direction: "FORWARD",
  cells: [{ row: 0, column: 0, z: 0 }, { row: 0, column: 0, z: 1 }],
  head: { row: 0, column: 0, z: 1 },
};

const arrowB: ArrowDto = {
  id: "b",
  color: "magenta",
  direction: "RIGHT",
  cells: [{ row: 0, column: 0, z: 0 }, { row: 0, column: 1, z: 0 }],
  head: { row: 0, column: 1, z: 0 },
};

function stateWith(overrides: Partial<GameUiState>): GameUiState {
  return {
    ...initialGameUiState,
    arrows: [arrowA, arrowB],
    bounds,
    arrowsRemaining: 2,
    attemptsRemaining: 3,
    overlay: GameOverlay.None,
    ...overrides,
  };
}

const noop = () => undefined;

describe("BoardView3D — C8 animations", () => {
  it("should_mount_active_arrows_and_not_render_empty_view_when_bounds_present", () => {
    const { getByTestId, queryByTestId } = render(
      <BoardView3D state={stateWith({})} onArrowTap={noop} />
    );
    expect(getByTestId("board-view-3d")).toBeTruthy();
    expect(queryByTestId("board-view-3d-empty")).toBeNull();
  });

  it("should_keep_canvas_mounted_when_an_arrow_becomes_extracted", () => {
    const { getByTestId, rerender } = render(
      <BoardView3D state={stateWith({})} onArrowTap={noop} />
    );
    act(() => {
      rerender(
        <BoardView3D state={stateWith({ extractedArrowIds: ["a"] })} onArrowTap={noop} />
      );
    });
    // Canvas must remain — the arrow is animating out, not immediately gone
    expect(getByTestId("board-view-3d-canvas")).toBeTruthy();
  });

  it("should_render_empty_view_when_bounds_are_null", () => {
    const { getByTestId, queryByTestId } = render(
      <BoardView3D state={stateWith({ arrows: [], bounds: null })} onArrowTap={noop} />
    );
    expect(getByTestId("board-view-3d-empty")).toBeTruthy();
    expect(queryByTestId("board-view-3d-canvas")).toBeNull();
  });

  it("should_remain_stable_when_shakeArrowId_transitions_to_non_null", () => {
    const { getByTestId, rerender } = render(
      <BoardView3D state={stateWith({ shakeArrowId: null })} onArrowTap={noop} />
    );
    act(() => {
      rerender(
        <BoardView3D state={stateWith({ shakeArrowId: "b" })} onArrowTap={noop} />
      );
    });
    expect(getByTestId("board-view-3d")).toBeTruthy();
  });

  it("should_handle_multiple_arrows_extracted_in_sequence", () => {
    const { getByTestId, rerender } = render(
      <BoardView3D state={stateWith({})} onArrowTap={noop} />
    );
    act(() => {
      rerender(
        <BoardView3D state={stateWith({ extractedArrowIds: ["a"] })} onArrowTap={noop} />
      );
    });
    act(() => {
      rerender(
        <BoardView3D state={stateWith({ extractedArrowIds: ["a", "b"] })} onArrowTap={noop} />
      );
    });
    expect(getByTestId("board-view-3d-canvas")).toBeTruthy();
  });
});
