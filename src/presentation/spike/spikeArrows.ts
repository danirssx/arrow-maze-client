/**
 * THROWAWAY SPIKE (MAZ-225 / T0). Not production code, not wired into the game.
 *
 * Synthetic arrow descriptors for the 3D render proof-of-concept: a handful of
 * short, axis-aligned bent paths scattered through a cube volume, in neon
 * colors. Deterministic (seeded LCG) so every run renders the same knot.
 */
export interface SpikeArrow {
  readonly id: string;
  readonly color: string;
  /** Ordered lattice points tail→head, in board coordinates. */
  readonly points: readonly [number, number, number][];
}

const NEON = ["#39FF14", "#00E5FF", "#FF10F0", "#FFF700", "#FF3131", "#7DF9FF", "#B026FF", "#FF6EC7"];
const AXES: readonly [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/** Generate `count` synthetic arrows inside a `size`³ lattice (default ~20 in a 4³ cube). */
export function generateSpikeArrows(count = 20, size = 4): SpikeArrow[] {
  let seed = 1234;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rnd() * list.length)] as T;

  const arrows: SpikeArrow[] = [];
  for (let i = 0; i < count; i++) {
    const dir = pick(AXES);
    const len = 2 + Math.floor(rnd() * 3);
    let cur: [number, number, number] = [
      Math.floor(rnd() * size),
      Math.floor(rnd() * size),
      Math.floor(rnd() * size),
    ];
    const points: [number, number, number][] = [cur];
    for (let s = 0; s < len; s++) {
      cur = [cur[0] + dir[0], cur[1] + dir[1], cur[2] + dir[2]];
      points.push(cur);
    }
    arrows.push({ id: `arrow-${i}`, color: NEON[i % NEON.length] as string, points });
  }
  return arrows;
}
