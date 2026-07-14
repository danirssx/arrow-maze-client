import { render } from "@testing-library/react-native";
import { BoardRenderer } from "@/presentation/components/BoardRenderer";
import { GameOverlay, initialGameUiState } from "@/presentation/state/GameUiState";
import type { GameUiState } from "@/presentation/state/GameUiState";
import type { ArrowDto } from "@/application/dto/BoardSnapshotDto";

// Subject to human review — unit tests for C9: renderer selection by level dimensions

const arrow2D: ArrowDto = {
  id: "a",
  color: "cyan",
  direction: "FORWARD",
  cells: [{ row: 0, column: 0 }, { row: 0, column: 1 }],
  head: { row: 0, column: 1 },
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
  it("should_render_2d_board_when_dimensions_is_2", () => {
    const state = stateWith({
      dimensions: 2,
      arrows: [arrow2D],
      bounds: { minRow: 0, minCol: 0, maxRow: 0, maxCol: 1 },
    });
    const { queryByTestId } = render(<BoardRenderer state={state} onArrowTap={noop} />);
    expect(queryByTestId("board-view-3d")).toBeNull();
    expect(queryByTestId("board-view-3d-empty")).toBeNull();
  });

  it("should_render_2d_board_by_default_when_dimensions_not_set", () => {
    // initialGameUiState has dimensions: 2
    const { queryByTestId } = render(
      <BoardRenderer state={stateWith({})} onArrowTap={noop} />
    );
    expect(queryByTestId("board-view-3d")).toBeNull();
  });

  it("should_render_3d_board_when_dimensions_is_3", () => {
    const state = stateWith({
      dimensions: 3,
      arrows: [arrow3D],
      bounds: { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, minZ: 0, maxZ: 1 },
    });
    const { getByTestId } = render(<BoardRenderer state={state} onArrowTap={noop} />);
    expect(getByTestId("board-view-3d")).toBeTruthy();
  });

  it("should_render_3d_canvas_when_dimensions_is_3_regardless_of_bounds_depth", () => {
    // A level declared as 3D keeps the 3D renderer even if all arrows share the same z.
    const state = stateWith({
      dimensions: 3,
      arrows: [arrow3D],
      bounds: { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, minZ: 0, maxZ: 1 },
    });
    const { getByTestId } = render(<BoardRenderer state={state} onArrowTap={noop} />);
    expect(getByTestId("board-view-3d-canvas")).toBeTruthy();
  });
});
