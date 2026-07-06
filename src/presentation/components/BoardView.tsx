import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import Svg from "react-native-svg";
import type { ArrowDto, CoordinateDto } from "@/application/dto/BoardSnapshotDto";
import type { GameUiState } from "@/presentation/state/GameUiState";
import { ExitingNeonArrow, NeonArrowBody } from "./board/NeonArrow";
import type { Point } from "./board/arrowSvgGeometry";

/**
 * Board canvas (arrow untangle) — SVG neon render.
 *
 * Every active arrow is drawn as a continuous neon "snake" (layered SVG strokes +
 * a filled head) over a dark dotted lattice, scrollable in both axes. Extraction
 * streams the arrow off-board.
 *
 * Hit-testing is deliberately split into two layers: the SVG visuals (one `<Svg>`
 * per arrow, all `pointerEvents="none"`) render at the bottom, and ALL per-cell
 * `Pressable` tap targets render in a single layer ON TOP of every `<Svg>`. This is
 * required because a board-sized react-native-svg `<Svg>` swallows touches on the
 * New Architecture even with `pointerEvents="none"`, so per-arrow `<Svg>` overlays
 * would otherwise block taps on the arrows beneath them. The view holds no game
 * rules — a tap just reports the arrow id upward.
 */

const CELL = 34; // lattice spacing (px)
const HEAD_HALF_CELL = CELL / 2; // a head never spills past its own cell
const DOT = 3; // dotted-lattice dot diameter
const PAD_CELLS = 3; // dotted margin around the arrows (unbounded feel)

const BG = "#11142A";
const DOT_COLOR = "#262C4E";

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

/** Dotted-lattice dot style centered on a pixel coordinate. */
function dotStyle(cx: number, cy: number) {
  return {
    position: "absolute" as const,
    left: cx - DOT / 2,
    top: cy - DOT / 2,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: DOT_COLOR
  };
}

type Center = (cell: CoordinateDto) => { cx: number; cy: number };

function centersOf(arrow: ArrowDto, center: Center): Point[] {
  return arrow.cells.map((cell) => {
    const { cx, cy } = center(cell);
    return { x: cx, y: cy };
  });
}

interface ArrowVisualProps {
  arrow: ArrowDto;
  center: Center;
  width: number;
  height: number;
  shaking: boolean;
}

/** An active arrow's neon snake (visual only). Shakes in place on a blocked tap. */
function ArrowVisual({ arrow, center, width, height, shaking }: ArrowVisualProps) {
  const hex = hexFor(arrow.color);
  const highlight = useMemo(() => lighten(hex), [hex]);
  const points = useMemo(() => centersOf(arrow, center), [arrow, center]);
  const shake = useRef(new Animated.Value(0)).current;

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
    <Animated.View pointerEvents="none" style={{ ...ABSOLUTE_FILL, transform: [{ translateX }] }}>
      <Svg pointerEvents="none" width={width} height={height} style={ABSOLUTE_FILL}>
        <NeonArrowBody points={points} direction={arrow.direction} color={hex} highlight={highlight} />
      </Svg>
    </Animated.View>
  );
}

interface ArrowHitTargetsProps {
  arrows: readonly ArrowDto[];
  center: Center;
  onTap: (arrowId: string) => void;
}

/** Single top layer of per-cell tap targets for every active arrow. */
function ArrowHitTargets({ arrows, center, onTap }: ArrowHitTargetsProps) {
  return (
    <View pointerEvents="box-none" style={ABSOLUTE_FILL}>
      {arrows.map((arrow) => {
        const headKey = `${arrow.head.row},${arrow.head.column}`;
        return arrow.cells.map((cell, index) => {
          const { cx, cy } = center(cell);
          const isHead = `${cell.row},${cell.column}` === headKey;
          return (
            <Pressable
              key={`hit-${arrow.id}-${index}`}
              testID={isHead ? `arrow-${arrow.id}` : undefined}
              accessibilityRole="button"
              onPress={() => onTap(arrow.id)}
              style={{
                position: "absolute",
                left: cx - HEAD_HALF_CELL,
                top: cy - HEAD_HALF_CELL,
                width: CELL,
                height: CELL
              }}
            />
          );
        });
      })}
    </View>
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
            {/* Dotted background: only the mask cells for a shaped board (Option A),
                otherwise the rectangular lattice fallback derived from arrow bounds. */}
            {state.boardShape && state.boardShape.length > 0 ? (
              <View testID="board-shape-dots" pointerEvents="none" style={ABSOLUTE_FILL}>
                {state.boardShape.map((cell) => {
                  const { cx, cy } = center(cell);
                  return (
                    <View
                      key={`dot-${cell.row}-${cell.column}`}
                      testID={`board-dot-${cell.row}-${cell.column}`}
                      pointerEvents="none"
                      style={dotStyle(cx, cy)}
                    />
                  );
                })}
              </View>
            ) : (
              <View testID="board-rect-dots" pointerEvents="none" style={ABSOLUTE_FILL}>
                {Array.from({ length: gRows * gCols }).map((_, index) => {
                  const r = Math.floor(index / gCols);
                  const c = index % gCols;
                  return (
                    <View
                      key={`dot-${r}-${c}`}
                      pointerEvents="none"
                      style={dotStyle(c * CELL + CELL / 2, r * CELL + CELL / 2)}
                    />
                  );
                })}
              </View>
            )}

            {/* Visual layer — neon snakes (non-interactive). */}
            {activeArrows.map((arrow) => (
              <ArrowVisual
                key={arrow.id}
                arrow={arrow}
                center={center}
                width={width}
                height={height}
                shaking={state.shakeArrowId === arrow.id}
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

            {/* Interaction layer — all tap targets, above every SVG. */}
            <ArrowHitTargets arrows={activeArrows} center={center} onTap={onArrowTap} />
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
