import { ProgressScreen } from "@/presentation/screens/ProgressScreen";
import { ProgressViewModel } from "@/presentation/view-models/ProgressViewModel";
import type { ProgressFacade } from "@/application/facades/ProgressFacade";
import type { LocalProgress } from "@/application/ports/IProgressRepository";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const LEVEL_UUID = "550e8400-e29b-41d4-a716-446655440010";

const PROGRESS: LocalProgress = {
  progressId: "p1",
  userId: "u1",
  version: 1,
  updatedAt: "2026-06-18T00:00:00.000Z",
  completedLevels: [
    { levelId: LEVEL_UUID, score: 1500, timeSeconds: 30, movesCount: 12, completedAt: "2026-06-18T00:00:00.000Z" },
  ],
  pendingSync: false,
};

function makeViewModel(): ProgressViewModel {
  const facade = { load: async () => PROGRESS } as unknown as ProgressFacade;
  return new ProgressViewModel(facade);
}

describe("ProgressScreen", () => {
  it("should_show_the_level_name_when_a_mapping_exists", async () => {
    const { findByText, queryByText } = renderWithProviders(
      <ProgressScreen
        viewModel={makeViewModel()}
        userId="u1"
        accessToken="t1"
        levelNameById={{ [LEVEL_UUID]: "Packed Start" }}
        onBack={jest.fn()}
      />,
    );

    expect(await findByText("Packed Start")).toBeTruthy();
    expect(queryByText(LEVEL_UUID)).toBeNull();
  });

  it("should_fall_back_to_the_raw_level_id_when_no_mapping_exists", async () => {
    const { findByText } = renderWithProviders(
      <ProgressScreen
        viewModel={makeViewModel()}
        userId="u1"
        accessToken="t1"
        levelNameById={{}}
        onBack={jest.fn()}
      />,
    );

    expect(await findByText(LEVEL_UUID)).toBeTruthy();
  });
});
