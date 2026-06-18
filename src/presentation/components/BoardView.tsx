import { Pressable, ScrollView, Text, View } from "react-native";
import type { GameUiState } from "@/presentation/state/GameUiState";

const CELL = 34;
const GAP = 2;
const DOT = 3;

const ARROW_GLYPH: Record<string, string> = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→" };

const COLOR_HEX: Record<string, string> = {
  blue: "#5262FB",
  green: "#56D879",
  yellow: "#FFC83D",
  pink: "#FF7BD5",
  cyan: "#46D5FF",
  purple: "#9B51E0",
  crimson: "#EB5757",
  white: "#FFFFFF",
  orange: "#F6A700",
  teal: "#2BC4B6"
};

function hexFor(color: string): string {
  return COLOR_HEX[color] ?? "#9DA6FB";
}

function glyphColor(color: string): string {
  return color === "white" || color === "yellow" ? "#0F0F0F" : "#FFFFFF";
}

interface BoardViewProps {
  state: GameUiState;
  onArrowTap: (arrowId: string) => void;
}

/**
 * Board canvas (arrow untangle).
 *
 * Renders the active arrows from `GameUiState` DTOs as colored rounded cells on a
 * dark dotted lattice, scrollable in both axes. Tapping any cell of an arrow
 * reports that arrow id upward; it contains no game rules. Coordinates are framed
 * by the snapshot `bounds` so negative lattice positions render correctly.
 */
export function BoardView({ state, onArrowTap }: BoardViewProps) {
  const bounds = state.bounds;
  if (bounds === null) {
    return <View testID="board-view" style={{ flex: 1, borderRadius: 24, backgroundColor: "#171A2B" }} />;
  }

  const extracted = new Set(state.extractedArrowIds);
  const activeArrows = state.arrows.filter((arrow) => !extracted.has(arrow.id));

  const rows = bounds.maxRow - bounds.minRow + 1;
  const cols = bounds.maxCol - bounds.minCol + 1;
  const width = cols * CELL;
  const height = rows * CELL;
  const left = (column: number): number => (column - bounds.minCol) * CELL;
  const top = (row: number): number => (row - bounds.minRow) * CELL;

  return (
    <View testID="board-view" style={{ flex: 1, borderRadius: 24, backgroundColor: "#171A2B", overflow: "hidden" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width, height }}>
            {Array.from({ length: rows * cols }).map((_, index) => {
              const r = Math.floor(index / cols);
              const c = index % cols;
              return (
                <View
                  key={`dot-${r}-${c}`}
                  style={{
                    position: "absolute",
                    left: c * CELL + CELL / 2 - DOT / 2,
                    top: r * CELL + CELL / 2 - DOT / 2,
                    width: DOT,
                    height: DOT,
                    borderRadius: DOT / 2,
                    backgroundColor: "#2C3150"
                  }}
                />
              );
            })}

            {activeArrows.flatMap((arrow) => {
              const hex = hexFor(arrow.color);
              const shaking = state.shakeArrowId === arrow.id;
              return arrow.cells.map((cell, index) => {
                const isHead = cell.row === arrow.head.row && cell.column === arrow.head.column;
                const baseStyle = {
                  position: "absolute" as const,
                  left: left(cell.column) + GAP,
                  top: top(cell.row) + GAP,
                  width: CELL - GAP * 2,
                  height: CELL - GAP * 2,
                  borderRadius: 8,
                  backgroundColor: hex,
                  alignItems: "center" as const,
                  justifyContent: "center" as const,
                  opacity: shaking ? 0.55 : 1,
                  borderWidth: shaking ? 2 : 0,
                  borderColor: "#FFFFFF"
                };
                return (
                  <Pressable
                    key={`${arrow.id}-${index}`}
                    testID={isHead ? `arrow-${arrow.id}` : undefined}
                    accessibilityRole="button"
                    onPress={() => onArrowTap(arrow.id)}
                    style={baseStyle}
                  >
                    {isHead ? (
                      <Text style={{ color: glyphColor(arrow.color), fontSize: 18, fontWeight: "900" }}>
                        {ARROW_GLYPH[arrow.direction] ?? ""}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              });
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
