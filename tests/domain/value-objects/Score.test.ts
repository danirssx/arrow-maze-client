import { InvalidScoreError } from "@/domain/value-objects/errors";
import { Score } from "@/domain/value-objects/Score";

describe("Score", () => {
  it("should_expose_its_value_when_created_from_a_non_negative_integer", () => {
    expect(Score.of(1500).value).toBe(1500);
    expect(Score.zero().value).toBe(0);
  });

  it("should_return_a_new_score_when_adding_points", () => {
    const base = Score.of(1000);

    const result = base.add(500);

    expect(result.value).toBe(1500);
    expect(base.value).toBe(1000);
  });

  it("should_reject_a_negative_score", () => {
    expect(() => Score.of(-1)).toThrow(InvalidScoreError);
  });

  it("should_reject_a_non_integer_score", () => {
    expect(() => Score.of(10.5)).toThrow(InvalidScoreError);
  });
});
