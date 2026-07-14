import type { GameUiState } from "@/presentation/state/GameUiState";
import { BoardView } from "./BoardView";
import { BoardView3D } from "./board3d/BoardView3D";

/**
 * Selects the correct board renderer based on `state.dimensions`.
 *
 * `dimensions === 3` → volumetric `BoardView3D` (Three.js GL render loop).
 * `dimensions === 2` → flat SVG `BoardView` (unchanged 2-D renderer).
 *
 * The switch is driven by the explicit `dimensions` field set by the ViewModel
 * from `LevelDefinition.dimensions`, NOT inferred from bounds — a level declared
 * as 3-D keeps the 3-D renderer even when all arrows happen to share the same z.
 */
export function BoardRenderer({
  state,
  onArrowTap,
}: {
  state: GameUiState;
  onArrowTap: (arrowId: string) => void;
}): React.JSX.Element {
  if (state.dimensions === 3) {
    return <BoardView3D state={state} onArrowTap={onArrowTap} />;
  }

  return <BoardView state={state} onArrowTap={onArrowTap} />;
}
