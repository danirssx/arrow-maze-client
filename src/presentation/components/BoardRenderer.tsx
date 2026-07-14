import type { GameUiState } from "@/presentation/state/GameUiState";
import { BoardView } from "./BoardView";
import { BoardView3D } from "./board3d/BoardView3D";

/**
 * Selects the correct board renderer based on the level's spatial dimensions.
 *
 * A level is considered volumetric (3-D) when its bounds have depth — i.e.
 * `maxZ > minZ`. Flat levels (all cells at the same z) use the existing 2-D
 * SVG renderer. When bounds are null the 2-D renderer is used as a fallback
 * (it already handles the null case gracefully).
 */
export function BoardRenderer({
  state,
  onArrowTap,
}: {
  state: GameUiState;
  onArrowTap: (arrowId: string) => void;
}): React.JSX.Element {
  const is3D = state.bounds !== null && state.bounds.maxZ > state.bounds.minZ;

  if (is3D) {
    return <BoardView3D state={state} onArrowTap={onArrowTap} />;
  }

  return <BoardView state={state} onArrowTap={onArrowTap} />;
}
