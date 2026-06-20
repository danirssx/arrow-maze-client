import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, View } from "react-native";
import Svg from "react-native-svg";
import type { ArrowDto, CoordinateDto } from "@/application/dto/BoardSnapshotDto";
import type { GameUiState } from "@/presentation/state/GameUiState";
import { ExitingNeonArrow, NeonArrowBody } from "./board/NeonArrow";
import type { Point } from "./board/arrowSvgGeometry";

/**
 * Board canvas (arrow untangle) — SVG neon render.
 *
 * Every active arrow is drawn as a continuous neon "snake" (layered SVG strokes +
 * a filled head) over a dark dotted lattice, scrollable in both axes. Tapping any
 * cell of an arrow reports that arrow id upward — the view holds no game rules.
 * When an arrow leaves the active set it animates extracting: its body unspools
 * along its own curve and streams off-board in the head direction (Reanimated
 * `strokeDashoffset` on the extended path). A blocked tap shakes the arrow in place.
 */

const CELL = 34; // lattice spacing (px)
const HEAD_HALF_CELL = CELL / 2; // a head never spills past its own cell
const DOT = 3; // dotted-lattice dot diameter
const PAD_CELLS = 3; // dotted margin around the arrows (unbounded feel)

const BG = "#11142A";
const DOT_COLOR = "#262C4E";
const PRESS_NUDGE = 7; // px an arrow lurches toward its head on tap (press feedback)

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

/** Blend a hex color toward white for the bright neon core highlight. */
function lighten(hex: string, amount = 0.5): string {
  const value = hex.replace("#", "");
  const channel = (start: number): number => {
    const base = parseInt(value.slice(start, start + 2), 16);
    return Math.round(base + (255 - base) * amount);
  };
  const toHex = (n: number): string => n.toString(16).padStart(2, "0");
  return `#${toHex(channel(0))}${toHex(channel(2))}${toHex(channel(4))}`;
}

type Center = (cell: CoordinateDto) => { cx: number; cy: number };

function centersOf(arrow: ArrowDto, center: Center): Point[] {
  return arrow.cells.map((cell) => {
    const { cx, cy } = center(cell);
    return { x: cx, y: cy };
  });
}

interface ArrowShapeProps {
  arrow: ArrowDto;
  center: Center;
  width: number;
  height: number;
  shaking: boolean;
  onTap: (arrowId: string) => void;
}

/** An active arrow: neon SVG snake + per-cell tap targets + shake/press feedback. */
function ArrowShape({ arrow, center, width, height, shaking, onTap }: ArrowShapeProps) {
  const hex = hexFor(arrow.color);
  const highlight = useMemo(() => lighten(hex), [hex]);
  const points = useMemo(() => centersOf(arrow, center), [arrow, center]);
  const shake = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const headKey = `${arrow.head.row},${arrow.head.column}`;
  const delta = DIR_DELTA[arrow.direction] ?? DIR_DELTA["RIGHT"]!;

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

  // Immediate tap feedback: a quick dim + lurch toward the head direction, so every
  // tap reacts even before the snapshot round-trip decides extract vs block.
  const handlePress = (): void => {
    pulse.stopAnimation();
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true })
    ]).start();
    onTap(arrow.id);
  };

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  const pulseX = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, delta.dx * PRESS_NUDGE] });
  const pulseY = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, delta.dy * PRESS_NUDGE] });
  const translateX = Animated.add(shakeX, pulseX);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ ...ABSOLUTE_FILL, opacity, transform: [{ translateX }, { translateY: pulseY }] }}
    >
      <Svg pointerEvents="none" width={width} height={height} style={ABSOLUTE_FILL}>
        <NeonArrowBody points={points} direction={arrow.direction} color={hex} highlight={highlight} />
      </Svg>
      {arrow.cells.map((cell, index) => {
        const { cx, cy } = center(cell);
        const isHead = `${cell.row},${cell.column}` === headKey;
        return (
          <Pressable
            key={`hit-${arrow.id}-${index}`}
            testID={isHead ? `arrow-${arrow.id}` : undefined}
            accessibilityRole="button"
            onPress={handlePress}
            style={{ position: "absolute", left: cx - HEAD_HALF_CELL, top: cy - HEAD_HALF_CELL, width: CELL, height: CELL }}
          />
        );
      })}
    </Animated.View>
  );
}

interface ExitingArrowProps {
  arrow: ArrowDto;
  center: Center;
  width: number;
  height: number;
  exitClearance: number;
  exitKey: number;
  onDone: (key: number) => void;
}

/** A just-extracted arrow streaming off-board, then unmounting. */
function ExitingArrow({ arrow, center, width, height, exitClearance, exitKey, onDone }: ExitingArrowProps) {
  const hex = hexFor(arrow.color);
  const highlight = lighten(hex);
  const points = centersOf(arrow, center);

  return (
    <Svg pointerEvents="none" width={width} height={height} style={ABSOLUTE_FILL}>
      <ExitingNeonArrow
        points={points}
        direction={arrow.direction}
        color={hex}
        highlight={highlight}
        exitClearance={exitClearance}
        exitKey={exitKey}
        onDone={onDone}
      />
    </Svg>
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

  // Track arrows that just left the active set and animate them streaming off.
  const seenExtracted = useRef<Set<string>>(new Set());
  const exitSeq = useRef(0);
  const [exiting, setExiting] = useState<{ key: number; arrow: ArrowDto }[]>([]);

  const handleExitDone = useCallback((doneKey: number) => {
    setExiting((prev) => prev.filter((item) => item.key !== doneKey));
  }, []);

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
  // Exit ray long enough that a body clears the clipped board from any interior cell.
  const exitClearance = Math.max(width, height);

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
                width={width}
                height={height}
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
                width={width}
                height={height}
                exitClearance={exitClearance}
                onDone={handleExitDone}
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
