import { fireEvent } from "@testing-library/react-native";
import { LevelCard } from "@/presentation/components/LevelCard";
import type { LevelListItem } from "@/presentation/view-models/LevelSelectViewModel";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation component test (MAZ-164 / CA-011)

function item(overrides: Partial<LevelListItem> = {}): LevelListItem {
  return {
    id: "lvl-1",
    name: "Test Level",
    order: 1,
    difficultyStars: 3,
    difficultyLabel: "Hard",
    arrowCount: 4,
    timed: false,
    locked: false,
    ...overrides
  };
}

function filledStars(stars: { props: { className?: string } }[]): number {
  return stars.filter((star) => star.props.className?.includes("text-reward-gold")).length;
}

describe("LevelCard", () => {
  // @s8 — the card renders the rating from difficultyStars, mapping no domain difficulty
  it("should_fill_stars_from_difficulty_stars", () => {
    const { getAllByText } = renderWithProviders(
      <LevelCard level={item({ difficultyStars: 3 })} onPress={jest.fn()} />
    );

    expect(filledStars(getAllByText("★"))).toBe(3);
  });

  it("should_fill_one_star_for_an_easy_level", () => {
    const { getAllByText } = renderWithProviders(
      <LevelCard level={item({ difficultyStars: 1, difficultyLabel: "Easy" })} onPress={jest.fn()} />
    );

    expect(filledStars(getAllByText("★"))).toBe(1);
  });

  // --- MAZ-191: sequential level locking ---
  it("should_render_a_lock_indicator_when_the_level_is_locked", () => {
    const { getByTestId } = renderWithProviders(
      <LevelCard level={item({ id: "lvl-2", locked: true })} onPress={jest.fn()} />
    );

    expect(getByTestId("level-card-lock-lvl-2")).toBeTruthy();
  });

  it("should_not_call_on_press_when_the_level_is_locked", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <LevelCard level={item({ id: "lvl-2", locked: true })} onPress={onPress} />
    );

    fireEvent.press(getByTestId("level-card-lvl-2"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("should_call_on_press_when_the_level_is_unlocked", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <LevelCard level={item({ id: "lvl-1", locked: false })} onPress={onPress} />
    );

    fireEvent.press(getByTestId("level-card-lvl-1"));

    expect(onPress).toHaveBeenCalledWith("lvl-1");
  });
});
