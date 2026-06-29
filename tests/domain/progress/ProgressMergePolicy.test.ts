import { ProgressMergePolicy } from "@/domain/progress";

function completion(overrides: {
  levelId?: string;
  score?: number;
  timeSeconds?: number;
  movesCount?: number;
  completedAt?: string;
}) {
  return {
    levelId: overrides.levelId ?? "550e8400-e29b-41d4-a716-446655440010",
    score: overrides.score ?? 500,
    timeSeconds: overrides.timeSeconds ?? 20,
    movesCount: overrides.movesCount ?? 5,
    completedAt: overrides.completedAt ?? "2026-06-18T00:00:00.000Z",
  };
}

describe("ProgressMergePolicy", () => {
  it("should_preserve_existing_completion_when_new_completion_has_worse_score", () => {
    const policy = new ProgressMergePolicy();
    const existing = completion({ score: 500, timeSeconds: 20 });
    const incoming = completion({ score: 100, timeSeconds: 10 });

    const merged = policy.mergeCompletion([existing], incoming);

    expect(merged).toEqual([existing]);
  });

  it("should_replace_existing_completion_when_scores_tie_and_new_completion_is_faster", () => {
    const policy = new ProgressMergePolicy();
    const existing = completion({ score: 500, timeSeconds: 30 });
    const incoming = completion({ score: 500, timeSeconds: 10 });

    const merged = policy.mergeCompletion([existing], incoming);

    expect(merged).toEqual([incoming]);
  });

  it("should_replace_existing_completion_when_new_completion_has_better_score_even_if_slower", () => {
    const policy = new ProgressMergePolicy();
    const existing = completion({ score: 100, timeSeconds: 10 });
    const incoming = completion({ score: 500, timeSeconds: 30 });

    const merged = policy.mergeCompletion([existing], incoming);

    expect(merged).toEqual([incoming]);
  });

  it("should_preserve_existing_completion_when_scores_tie_and_new_completion_is_slower", () => {
    const policy = new ProgressMergePolicy();
    const existing = completion({ score: 500, timeSeconds: 10 });
    const incoming = completion({ score: 500, timeSeconds: 30 });

    const merged = policy.mergeCompletion([existing], incoming);

    expect(merged).toEqual([existing]);
  });

  it("should_preserve_existing_completion_when_score_and_time_are_equal", () => {
    const policy = new ProgressMergePolicy();
    const existing = completion({
      score: 500,
      timeSeconds: 10,
      completedAt: "2026-06-17T00:00:00.000Z",
    });
    const incoming = completion({
      score: 500,
      timeSeconds: 10,
      completedAt: "2026-06-18T00:00:00.000Z",
    });

    const merged = policy.mergeCompletion([existing], incoming);

    expect(merged).toEqual([existing]);
  });

  it("should_append_incoming_completion_when_level_was_not_completed_before", () => {
    const policy = new ProgressMergePolicy();
    const existing = completion({ levelId: "550e8400-e29b-41d4-a716-446655440010", score: 500 });
    const incoming = completion({ levelId: "550e8400-e29b-41d4-a716-446655440011", score: 100 });

    const merged = policy.mergeCompletion([existing], incoming);

    expect(merged).toEqual([existing, incoming]);
  });

  it("should_preserve_other_completed_levels_when_replacing_one_completion", () => {
    const policy = new ProgressMergePolicy();
    const other = completion({ levelId: "550e8400-e29b-41d4-a716-446655440011", score: 200 });
    const existing = completion({ levelId: "550e8400-e29b-41d4-a716-446655440010", score: 100 });
    const incoming = completion({ levelId: "550e8400-e29b-41d4-a716-446655440010", score: 500 });

    const merged = policy.mergeCompletion([other, existing], incoming);

    expect(merged).toEqual([other, incoming]);
  });
});
