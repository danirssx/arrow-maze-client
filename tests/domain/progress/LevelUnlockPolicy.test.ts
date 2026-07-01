import { LevelUnlockPolicy } from "@/domain/progress/LevelUnlockPolicy";

// Subject to human review — domain policy test

const LEVELS = [
  { id: "l1", order: 1 },
  { id: "l2", order: 2 },
  { id: "l3", order: 3 },
];

describe("LevelUnlockPolicy", () => {
  const policy = new LevelUnlockPolicy();

  it("should_unlock_only_the_first_level_when_there_is_no_progress", () => {
    const locked = policy.lockedLevelIds(LEVELS, []);

    expect(locked.has("l1")).toBe(false);
    expect(locked.has("l2")).toBe(true);
    expect(locked.has("l3")).toBe(true);
  });

  it("should_unlock_the_next_level_when_its_predecessor_is_completed", () => {
    const locked = policy.lockedLevelIds(LEVELS, ["l1"]);

    expect(locked.has("l2")).toBe(false);
    expect(locked.has("l3")).toBe(true);
  });

  it("should_report_a_level_as_unlocked_when_its_predecessor_is_completed", () => {
    expect(policy.isUnlocked(LEVELS, ["l1"], "l2")).toBe(true);
  });

  it("should_report_a_level_as_locked_when_its_predecessor_is_not_completed", () => {
    expect(policy.isUnlocked(LEVELS, [], "l2")).toBe(false);
  });

  it("should_keep_an_already_completed_level_unlocked_even_with_a_missing_predecessor", () => {
    // Offline / legacy gap: level 3 was completed but level 2 was not recorded.
    expect(policy.isUnlocked(LEVELS, ["l3"], "l3")).toBe(true);
  });

  it("should_report_an_unknown_level_as_locked", () => {
    expect(policy.isUnlocked(LEVELS, ["l1", "l2", "l3"], "does-not-exist")).toBe(false);
  });

  it("should_order_levels_by_order_before_deciding_regardless_of_input_order", () => {
    const shuffled = [
      { id: "l3", order: 3 },
      { id: "l1", order: 1 },
      { id: "l2", order: 2 },
    ];

    expect(policy.isUnlocked(shuffled, [], "l1")).toBe(true);
    expect(policy.isUnlocked(shuffled, ["l1"], "l2")).toBe(true);
    expect(policy.isUnlocked(shuffled, ["l1"], "l3")).toBe(false);
  });
});
