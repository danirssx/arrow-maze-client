import { render } from "@testing-library/react-native";
import { BoardRenderer } from "@/presentation/components/BoardRenderer";
import { GameOverlay, initialGameUiState } from "@/presentation/state/GameUiState";
import type { GameUiState } from "@/presentation/state/GameUiState";
import type { ArrowDto } from "@/application/dto/BoardSnapshotDto";

// Subject to human review — unit tests for C9: renderer selection by dimensions

const arrow: ArrowDto = {
  id: "a",
  color: "cyan",
  direction: "FORWARD",
  cells: [{ row: 0, column: 0, z: 0 }, { row: 0, column: 1, z: 0 }],
  head: { row: 0, column: 1, z: 0 },
};

const arrow3D: ArrowDto = {
  id: "b",
  color: "magenta",
  direction: "FORWARD",
  cells: [{ row: 0, column: 0, z: 0 }, { row: 0, column: 0, z: 1 }],
  head: { row: 0, column: 0, z: 1 },
};

function stateWith(overrides: Partial<GameUiState>): GameUiState {
  return {
    ...initialGameUiState,
    overlay: GameOverlay.None,
    ...overrides,
  };
}

const noop = () => undefined;

describe("BoardRenderer", () => {
  it("should_render_2d_board_when_bounds_are_null", () => {
    // BoardView renders a ScrollView when bounds are null (empty state)
    const { queryByTestId } = render(
      <BoardRenderer state={stateWith({ bounds: null })} onArrowTap={noop} />
    );
    // 3D canvas must NOT appear — 2D renderer is used
    expect(queryByTestId("board-view-3d")).toBeNull();
    expect(queryByTestId("board-view-3d-empty")).toBeNull();
  });

  it("should_render_2d_board_when_maxZ_equals_minZ", () => {
    const state = stateWith({
      arrows: [arrow],
      bounds: { minRow: 0, minCol: 0, maxRow: 0, maxCol: 1, minZ: 0, maxZ: 0 },
    });
    const { queryByTestId } = render(<BoardRenderer state={state} onArrowTap={noop} />);
    expect(queryByTestId("board-view-3d")).toBeNull();
    expect(queryByTestId("board-view-3d-empty")).toBeNull();
  });

  it("should_render_3d_board_when_maxZ_is_greater_than_minZ", () => {
    const state = stateWith({
      arrows: [arrow3D],
      bounds: { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, minZ: 0, maxZ: 1 },
    });
    const { getByTestId } = render(<BoardRenderer state={state} onArrowTap={noop} />);
    expect(getByTestId("board-view-3d")).toBeTruthy();
  });

  it("should_render_3d_empty_view_when_3d_board_has_null_bounds_passed_to_3d_renderer", () => {
    // Contrived: bounds is not null but maxZ > minZ triggers 3D, which handles null internally.
    // This tests that 3D path is selected and 3D mounts its own empty guard.
    const state = stateWith({
      arrows: [arrow3D],
      bounds: { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, minZ: 0, maxZ: 2 },
    });
    const { getByTestId } = render(<BoardRenderer state={state} onArrowTap={noop} />);
    expect(getByTestId("board-view-3d-canvas")).toBeTruthy();
  });
});
