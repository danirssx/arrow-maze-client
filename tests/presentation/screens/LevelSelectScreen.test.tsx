import { fireEvent } from "@testing-library/react-native";
import { LevelSelectScreen } from "@/presentation/screens/LevelSelectScreen";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const levels = new LevelSelectViewModel().getLevels();
const firstLevel = levels[0]!;

describe("LevelSelectScreen", () => {
  it("should_render_a_card_per_level", () => {
    const { getByTestId } = renderWithProviders(
      <LevelSelectScreen levels={levels} onSelect={jest.fn()} onBack={jest.fn()} />
    );

    expect(getByTestId(`level-card-${firstLevel.id}`)).toBeTruthy();
  });

  it("should_call_on_select_with_level_id_when_card_is_pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = renderWithProviders(
      <LevelSelectScreen levels={levels} onSelect={onSelect} onBack={jest.fn()} />
    );

    fireEvent.press(getByTestId(`level-card-${firstLevel.id}`));

    expect(onSelect).toHaveBeenCalledWith(firstLevel.id);
  });
});
