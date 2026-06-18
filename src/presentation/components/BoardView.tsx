import { Pressable, Text, View } from "react-native";
import type { BoardCellDto } from "@/application/dto/BoardSnapshotDto";
import type { PositionDto } from "@/application/use-cases/game/GameSnapshotDto";
import type { GameUiState } from "@/presentation/state/GameUiState";

const ARROW_GLYPH: Record<string, string> = {
  UP: "↑",
  DOWN: "↓",
  LEFT: "←",
  RIGHT: "→"
};

interface BoardViewProps {
  state: GameUiState;
  onCellTap: (position: PositionDto) => void;
}

type CellStyle = {
  readonly background: string;
  readonly glyph: string;
  readonly glyphColor: string;
};

function styleFor(cell: BoardCellDto | undefined): CellStyle {
  if (cell === undefined) {
    return { background: "bg-background-soft", glyph: "", glyphColor: "text-text-muted" };
  }
  switch (cell.type) {
    case "WALL":
      return { background: "bg-primary-900", glyph: "", glyphColor: "text-text-inverse" };
    case "EXIT":
      return { background: "bg-reward-green", glyph: "⚑", glyphColor: "text-text-inverse" };
    case "ARROW":
      return {
        background: "bg-primary-100",
        glyph: ARROW_GLYPH[cell.direction ?? ""] ?? "",
        glyphColor: "text-primary-700"
      };
    default:
      return { background: "bg-background-soft", glyph: "", glyphColor: "text-text-muted" };
  }
}

/**
 * Board grid view.
 *
 * Renders the static board from the `GameUiState` DTOs and reports cell taps
 * upward. It contains no game rules: it only draws cells and forwards taps to
 * the controller, which is the single path into `GameViewModel.playTurn`.
 */
export function BoardView({ state, onCellTap }: BoardViewProps) {
  const cellAt = (row: number, col: number): BoardCellDto | undefined =>
    state.cells.find((cell) => cell.row === row && cell.column === col);

  const isPlayer = (row: number, col: number): boolean =>
    state.playerPosition?.row === row && state.playerPosition?.column === col;

  return (
    <View testID="board-view" className="items-center gap-1.5">
      {Array.from({ length: state.rows }).map((_, row) => (
        <View key={`row-${row}`} className="flex-row gap-1.5">
          {Array.from({ length: state.cols }).map((_, col) => {
            const style = styleFor(cellAt(row, col));
            const player = isPlayer(row, col);
            return (
              <Pressable
                key={`cell-${row}-${col}`}
                testID={`cell-${row}-${col}`}
                accessibilityRole="button"
                onPress={() => onCellTap({ row, column: col })}
                className={`h-12 w-12 items-center justify-center rounded-xl ${style.background} ${
                  player ? "border-2 border-primary-700" : ""
                } active:opacity-70`}
              >
                {player ? (
                  <View testID="player-token" className="h-5 w-5 rounded-full bg-primary-700" />
                ) : (
                  <Text className={`text-xl font-bold ${style.glyphColor}`}>{style.glyph}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
