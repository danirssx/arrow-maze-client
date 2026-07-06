import { isUuid } from "@/shared/isUuid";

describe("isUuid", () => {
  it("should_return_true_when_value_is_a_v4_uuid", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440010")).toBe(true);
  });

  it("should_return_false_when_value_is_a_slug", () => {
    expect(isUuid("manual-001-first-knot")).toBe(false);
  });

  it("should_return_false_when_value_is_empty", () => {
    expect(isUuid("")).toBe(false);
  });

  it("should_return_false_when_value_is_a_non_v4_uuid", () => {
    // version nibble is 1, not 4
    expect(isUuid("550e8400-e29b-11d4-a716-446655440010")).toBe(false);
  });

  it("should_return_false_when_value_has_a_leading_prefix", () => {
    expect(isUuid("x550e8400-e29b-41d4-a716-446655440010")).toBe(false);
  });

  it("should_return_false_when_value_has_a_trailing_suffix", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440010x")).toBe(false);
  });
});
