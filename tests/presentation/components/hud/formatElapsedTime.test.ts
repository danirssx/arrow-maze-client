import { formatElapsedTime } from "@/presentation/components/hud/formatElapsedTime";

// Subject to human review — presentation pure-formatter test
// Covers @s5 of specs/gameplay-visible-timer-MAZ-220.feature

describe("formatElapsedTime", () => {
  it("should_render_zero_when_no_time_elapsed", () => {
    expect(formatElapsedTime(0)).toBe("00:00");
  });

  it("should_zero_pad_seconds_when_under_ten", () => {
    expect(formatElapsedTime(7_000)).toBe("00:07");
  });

  it("should_truncate_partial_seconds_when_millis_are_not_whole", () => {
    expect(formatElapsedTime(7_999)).toBe("00:07");
  });

  it("should_roll_into_minutes_when_a_minute_elapses", () => {
    expect(formatElapsedTime(60_000)).toBe("01:00");
  });

  it("should_zero_pad_both_fields_when_under_ten_minutes", () => {
    expect(formatElapsedTime(5 * 60_000 + 4_000)).toBe("05:04");
  });

  it("should_not_wrap_minutes_when_match_exceeds_one_hour", () => {
    expect(formatElapsedTime(61 * 60_000 + 7_000)).toBe("61:07");
  });

  it("should_render_zero_when_input_is_negative", () => {
    expect(formatElapsedTime(-1_000)).toBe("00:00");
  });

  it("should_render_zero_when_input_is_not_finite", () => {
    expect(formatElapsedTime(Number.NaN)).toBe("00:00");
    expect(formatElapsedTime(Number.POSITIVE_INFINITY)).toBe("00:00");
  });
});
