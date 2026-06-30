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

  it("should_show_the_level_name", () => {
    const { getByText } = renderWithProviders(
      <LevelCard level={item({ name: "Packed Start" })} onPress={jest.fn()} />
    );

    expect(getByText("Packed Start")).toBeTruthy();
  });

  it("should_truncate_a_long_level_name_to_one_line", () => {
    const longName = "An Extremely Long Level Name That Would Overflow A Narrow Card";
    const { getByTestId } = renderWithProviders(
      <LevelCard level={item({ id: "lvl-9", name: longName })} onPress={jest.fn()} />
    );

    const nameNode = getByTestId("level-card-name-lvl-9");
    expect(nameNode.props.numberOfLines).toBe(1);
    expect(nameNode.props.children).toBe(longName);
  });
});
