import { generateSpikeArrows } from "@/presentation/spike/spikeArrows";

describe("generateSpikeArrows (MAZ-225 spike)", () => {
  it("should_generate_the_requested_number_of_arrows", () => {
    expect(generateSpikeArrows(20, 4)).toHaveLength(20);
  });

  it("should_produce_orthogonally_connected_unit_step_paths", () => {
    for (const arrow of generateSpikeArrows(20, 4)) {
      expect(arrow.points.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < arrow.points.length; i++) {
        const [ax, ay, az] = arrow.points[i - 1] as [number, number, number];
        const [bx, by, bz] = arrow.points[i] as [number, number, number];
        expect(Math.abs(ax - bx) + Math.abs(ay - by) + Math.abs(az - bz)).toBe(1);
      }
    }
  });

  it("should_be_deterministic_across_runs", () => {
    expect(generateSpikeArrows(20, 4)).toEqual(generateSpikeArrows(20, 4));
  });
});
