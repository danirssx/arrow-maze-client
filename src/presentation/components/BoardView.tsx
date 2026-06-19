import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, View } from "react-native";
import type { ArrowDto, CoordinateDto } from "@/application/dto/BoardSnapshotDto";
import type { GameUiState } from "@/presentation/state/GameUiState";

/**
 * Board canvas (arrow untangle) — art-directed render.
 *
 * Draws every active arrow as a continuous rounded "snake" (rounded nodes + thick
 * edges + a triangular head) sitting on a dark dotted lattice, scrollable in both
 * axes. The dotted field is extended past the arrow bounds so the board reads as an
 * unbounded canvas with an organic, non-square silhouette. Tapping any cell of an
 * arrow reports that arrow id upward — the view holds no game rules. When an arrow
 * leaves the active set it is animated flying off in its head direction (extraction
 * feedback); a blocked tap shakes the arrow in place.
 */

const CELL = 30; // lattice spacing (px)
const THICK = 12; // arrow body thickness
const HEAD = 17; // arrowhead length / half-base reference
const DOT = 3; // dotted-lattice dot diameter
const PAD_CELLS = 3; // dotted margin around the arrows (unbounded feel)

const BG = "#11142A";
const DOT_COLOR = "#262C4E";
const FLY = 720; // px an extracted arrow travels off-board

const COLOR_HEX: Record<string, string> = {
  blue: "#4B6BFB",
  green: "#3FD06A",
  yellow: "#FFC83D",
  pink: "#FF6FD8",
  cyan: "#3FC8FF",
  purple: "#A06BFF",
  crimson: "#C23B57",
  white: "#EEF1FF",
  orange: "#FF9F1C",
  teal: "#22C9B6"
};

const DIR_DELTA: Record<string, { dx: number; dy: number }> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 }
};

const ABSOLUTE_FILL = { position: "absolute" as const, left: 0, top: 0, right: 0, bottom: 0 };

function hexFor(color: string): string {
  return COLOR_HEX[color] ?? "#9DA6FB";
}

type Center = (cell: CoordinateDto) => { cx: number; cy: number };

/** Pure geometry of an arrow's snake body (nodes + edges + head), no interaction. */
function arrowShapes(arrow: ArrowDto, hex: string, center: Center): React.ReactNode[] {
  const shapes: React.ReactNode[] = [];
  const headKey = `${arrow.head.row},${arrow.head.column}`;

  // Rounded nodes at every cell except the head (rounded corners + tail cap).
  arrow.cells.forEach((cell, index) => {
    if (`${cell.row},${cell.column}` === headKey) return;
    const { cx, cy } = center(cell);
    shapes.push(
      <View
        key={`n-${arrow.id}-${index}`}
        pointerEvents="none"
        style={{
          position: "absolute",
          left: cx - THICK / 2,
          top: cy - THICK / 2,
          width: THICK,
          height: THICK,
          borderRadius: THICK / 2,
          backgroundColor: hex
        }}
      />
    );
  });

  // Thick edges between consecutive cells.
  for (let i = 0; i < arrow.cells.length - 1; i += 1) {
    const a = center(arrow.cells[i]!);
    const b = center(arrow.cells[i + 1]!);
    const horizontal = a.cy === b.cy;
    shapes.push(
      <View
        key={`e-${arrow.id}-${i}`}
        pointerEvents="none"
        style={{
          position: "absolute",
          left: horizontal ? Math.min(a.cx, b.cx) : a.cx - THICK / 2,
          top: horizontal ? a.cy - THICK / 2 : Math.min(a.cy, b.cy),
          width: horizontal ? Math.abs(b.cx - a.cx) : THICK,
          height: horizontal ? THICK : Math.abs(b.cy - a.cy),
          backgroundColor: hex
        }}
      />
    );
  }

  shapes.push(headTriangle(arrow, hex, center));
  return shapes;
}

/** Filled triangular arrowhead at the head cell, pointing in the arrow direction. */
function headTriangle(arrow: ArrowDto, hex: string, center: Center): React.ReactNode {
  const { cx, cy } = center(arrow.head);
  const half = HEAD - 3;
  const len = HEAD;
  const base = {
    position: "absolute" as const,
    width: 0,
    height: 0,
    borderStyle: "solid" as const,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    borderBottomColor: "transparent"
  };
  let style: object;
  switch (arrow.direction) {
    case "UP":
      style = { ...base, left: cx - half, top: cy - len, borderLeftWidth: half, borderRightWidth: half, borderBottomWidth: len, borderBottomColor: hex };
      break;
    case "DOWN":
      style = { ...base, left: cx - half, top: cy, borderLeftWidth: half, borderRightWidth: half, borderTopWidth: len, borderTopColor: hex };
      break;
    case "LEFT":
      style = { ...base, left: cx - len, top: cy - half, borderTopWidth: half, borderBottomWidth: half, borderRightWidth: len, borderRightColor: hex };
      break;
    default: // RIGHT
      style = { ...base, left: cx, top: cy - half, borderTopWidth: half, borderBottomWidth: half, borderLeftWidth: len, borderLeftColor: hex };
      break;
  }
  return <View key={`h-${arrow.id}`} pointerEvents="none" style={style} />;
}

interface ArrowShapeProps {
  arrow: ArrowDto;
  center: Center;
  shaking: boolean;
  onTap: (arrowId: string) => void;
}

/** An active arrow: snake body + per-cell tap targets + shake feedback. */
function ArrowShape({ arrow, center, shaking, onTap }: ArrowShapeProps) {
  const hex = hexFor(arrow.color);
  const shake = useRef(new Animated.Value(0)).current;
  const headKey = `${arrow.head.row},${arrow.head.column}`;

  useEffect(() => {
    if (!shaking) return undefined;
    shake.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true })
    ]);
    animation.start();
    return () => animation.stop();
  }, [shaking, shake]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });

  return (
    <Animated.View pointerEvents="box-none" style={{ ...ABSOLUTE_FILL, transform: [{ translateX }] }}>
      {arrowShapes(arrow, hex, center)}
      {arrow.cells.map((cell, index) => {
        const { cx, cy } = center(cell);
        const isHead = `${cell.row},${cell.column}` === headKey;
        return (
          <Pressable
            key={`hit-${arrow.id}-${index}`}
            testID={isHead ? `arrow-${arrow.id}` : undefined}
            accessibilityRole="button"
            onPress={() => onTap(arrow.id)}
            style={{ position: "absolute", left: cx - CELL / 2, top: cy - CELL / 2, width: CELL, height: CELL }}
          />
        );
      })}
    </Animated.View>
  );
}

interface ExitingArrowProps {
  arrow: ArrowDto;
  center: Center;
  onDone: (key: number) => void;
  exitKey: number;
}

/** A just-extracted arrow flying off-board in its head direction, then unmounts. */
function ExitingArrow({ arrow, center, onDone, exitKey }: ExitingArrowProps) {
  const hex = hexFor(arrow.color);
  const progress = useRef(new Animated.Value(0)).current;
  const delta = DIR_DELTA[arrow.direction] ?? DIR_DELTA["RIGHT"]!;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 360,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true
    });
    animation.start(({ finished }) => {
      if (finished) onDone(exitKey);
    });
    return () => animation.stop();
  }, [progress, onDone, exitKey]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, delta.dx * FLY] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, delta.dy * FLY] });
  const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View pointerEvents="none" style={{ ...ABSOLUTE_FILL, opacity, transform: [{ translateX }, { translateY }] }}>
      {arrowShapes(arrow, hex, center)}
    </Animated.View>
  );
}

interface BoardViewProps {
  state: GameUiState;
  onArrowTap: (arrowId: string) => void;
}

export function BoardView({ state, onArrowTap }: BoardViewProps) {
  const bounds = state.bounds;

  const arrowsById = useMemo(() => {
    const map = new Map<string, ArrowDto>();
    for (const arrow of state.arrows) map.set(arrow.id, arrow);
    return map;
  }, [state.arrows]);

  // Track arrows that just left the active set and animate them flying off.
  const seenExtracted = useRef<Set<string>>(new Set());
  const exitSeq = useRef(0);
  const [exiting, setExiting] = useState<{ key: number; arrow: ArrowDto }[]>([]);

  useEffect(() => {
    const current = new Set(state.extractedArrowIds);
    const added: { key: number; arrow: ArrowDto }[] = [];
    for (const id of current) {
      if (!seenExtracted.current.has(id)) {
        const arrow = arrowsById.get(id);
        if (arrow) {
          exitSeq.current += 1;
          added.push({ key: exitSeq.current, arrow });
        }
      }
    }
    seenExtracted.current = current;
    if (added.length > 0) setExiting((prev) => [...prev, ...added]);
  }, [state.extractedArrowIds, arrowsById]);

  if (bounds === null) {
    return <View testID="board-view" style={{ flex: 1, borderRadius: 28, backgroundColor: BG }} />;
  }

  const gMinRow = bounds.minRow - PAD_CELLS;
  const gMinCol = bounds.minCol - PAD_CELLS;
  const gRows = bounds.maxRow + PAD_CELLS - gMinRow + 1;
  const gCols = bounds.maxCol + PAD_CELLS - gMinCol + 1;
  const width = gCols * CELL;
  const height = gRows * CELL;

  const center: Center = (cell) => ({
    cx: (cell.column - gMinCol) * CELL + CELL / 2,
    cy: (cell.row - gMinRow) * CELL + CELL / 2
  });

  const extracted = new Set(state.extractedArrowIds);
  const activeArrows = state.arrows.filter((arrow) => !extracted.has(arrow.id));

  return (
    <View testID="board-view" style={{ flex: 1, borderRadius: 28, backgroundColor: BG, overflow: "hidden" }}>
      <ScrollView
        contentContainerStyle={{ minHeight: "100%", justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          contentContainerStyle={{ minWidth: "100%", justifyContent: "center" }}
          showsHorizontalScrollIndicator={false}
        >
          <View style={{ width, height, margin: 16 }}>
            {Array.from({ length: gRows * gCols }).map((_, index) => {
              const r = Math.floor(index / gCols);
              const c = index % gCols;
              return (
                <View
                  key={`dot-${r}-${c}`}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: c * CELL + CELL / 2 - DOT / 2,
                    top: r * CELL + CELL / 2 - DOT / 2,
                    width: DOT,
                    height: DOT,
                    borderRadius: DOT / 2,
                    backgroundColor: DOT_COLOR
                  }}
                />
              );
            })}

            {activeArrows.map((arrow) => (
              <ArrowShape
                key={arrow.id}
                arrow={arrow}
                center={center}
                shaking={state.shakeArrowId === arrow.id}
                onTap={onArrowTap}
              />
            ))}

            {exiting.map(({ key, arrow }) => (
              <ExitingArrow
                key={`exit-${key}`}
                exitKey={key}
                arrow={arrow}
                center={center}
                onDone={(doneKey) => setExiting((prev) => prev.filter((item) => item.key !== doneKey))}
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
