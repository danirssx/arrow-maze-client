import { render } from "@testing-library/react-native";
import type { ArrowDto } from "@/application/dto/BoardSnapshotDto";
import { BoardView3D } from "@/presentation/components/board3d/BoardView3D";
import { GameOverlay, initialGameUiState } from "@/presentation/state/GameUiState";
import type { GameUiState } from "@/presentation/state/GameUiState";

// Subject to human review — presentation component test

const arrow: ArrowDto = {
  id: "depth",
  color: "cyan",
  direction: "FORWARD",
  cells: [
    { row: 0, column: 0, z: 0 },
    { row: 0, column: 0, z: 1 },
    { row: 0, column: 0, z: 2 },
  ],
  head: { row: 0, column: 0, z: 2 },
};

function stateWith(overrides: Partial<GameUiState>): GameUiState {
  return {
    ...initialGameUiState,
    arrows: [arrow],
    bounds: { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, minZ: 0, maxZ: 2 },
    arrowsRemaining: 1,
    attemptsRemaining: 3,
    overlay: GameOverlay.None,
    ...overrides,
  };
}

describe("BoardView3D", () => {
  it("should_mount_a_canvas_for_a_volumetric_board", () => {
    const { getByTestId } = render(<BoardView3D state={stateWith({})} />);

    expect(getByTestId("board-view-3d")).toBeTruthy();
    expect(getByTestId("board-view-3d-canvas")).toBeTruthy();
  });

  it("should_render_an_empty_3d_board_without_canvas_when_bounds_are_null", () => {
    const { getByTestId, queryByTestId } = render(
      <BoardView3D state={stateWith({ arrows: [], bounds: null })} />
    );

    expect(getByTestId("board-view-3d-empty")).toBeTruthy();
    expect(queryByTestId("board-view-3d-canvas")).toBeNull();
  });

  it("should_not_throw_when_rendered_without_onArrowTap_prop", () => {
    // @s5 — backward compat: static C5 callers omit the prop
    expect(() => render(<BoardView3D state={stateWith({})} />)).not.toThrow();
  });
});
