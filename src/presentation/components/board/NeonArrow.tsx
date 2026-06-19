import { useEffect } from "react";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { Path, Polygon } from "react-native-svg";
import { buildArrowExtraction, headTrianglePoints, polylinePath } from "./arrowSvgGeometry";
import type { Point } from "./arrowSvgGeometry";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Core body thickness of an arrow stroke (px). */
export const ARROW_THICK = 12;
const HALO_EXTRA = 10; // halo stroke is this much wider than the core
const CORE_INSET = 7; // bright inner highlight is this much thinner than the core
const HEAD_LEN = 13; // arrowhead tip distance ahead of the head center
const HEAD_HALF = 9; // arrowhead half-width (kept so the head stays <= CELL/2)

const EXIT_DURATION_MS = 420;

// Layered semi-transparent strokes fake the neon glow without a (costly) SVG blur:
// a wide soft halo, the solid core, and a thin bright inner highlight.
const STROKE_LAYERS = [
  { widthDelta: HALO_EXTRA, opacity: 0.16, highlight: false },
  { widthDelta: 0, opacity: 1, highlight: false },
  { widthDelta: -CORE_INSET, opacity: 0.85, highlight: true }
] as const;

interface NeonArrowBodyProps {
  points: readonly Point[];
  direction: string;
  color: string;
  highlight: string;
}

/** Static neon arrow for an active board arrow (snake body + filled head). */
export function NeonArrowBody({ points, direction, color, highlight }: NeonArrowBodyProps) {
  const body = polylinePath(points);
  const headCenter = points[points.length - 1];

  return (
    <>
      {body !== ""
        ? STROKE_LAYERS.map((layer, index) => (
            <Path
              key={`s-${index}`}
              d={body}
              stroke={layer.highlight ? highlight : color}
              strokeWidth={ARROW_THICK + layer.widthDelta}
              strokeOpacity={layer.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))
        : null}
      {headCenter ? (
        <Polygon points={headTrianglePoints(headCenter, direction, HEAD_LEN, HEAD_HALF)} fill={color} />
      ) : null}
    </>
  );
}

interface ExitingNeonArrowProps {
  points: readonly Point[];
  direction: string;
  color: string;
  highlight: string;
  exitClearance: number;
  exitKey: number;
  onDone: (exitKey: number) => void;
}

/**
 * An extracted arrow streaming off-board. A body-length dash window slides along the
 * extended path (body + off-board exit ray) by animating `strokeDashoffset` on the
 * UI thread (Reanimated), so the snake unspools along its own curve and trails
 * straight out in the head direction — the reference exit animation.
 */
export function ExitingNeonArrow({
  points,
  direction,
  color,
  highlight,
  exitClearance,
  exitKey,
  onDone
}: ExitingNeonArrowProps) {
  const geometry = buildArrowExtraction(points, direction, exitClearance);
  const totalLength = geometry.totalLength;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: EXIT_DURATION_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onDone)(exitKey);
      }
    );
  }, [progress, onDone, exitKey]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.value * totalLength
  }));

  if (geometry.totalPath === "") return null;
  const dash: number[] = [geometry.bodyLength, geometry.totalLength];

  return (
    <>
      {STROKE_LAYERS.map((layer, index) => (
        <AnimatedPath
          key={`x-${index}`}
          d={geometry.totalPath}
          stroke={layer.highlight ? highlight : color}
          strokeWidth={ARROW_THICK + layer.widthDelta}
          strokeOpacity={layer.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={dash}
          animatedProps={animatedProps}
        />
      ))}
    </>
  );
}
