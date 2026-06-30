import { ProgressScreen } from "@/presentation/screens/ProgressScreen";
import { ProgressViewModel } from "@/presentation/view-models/ProgressViewModel";
import type { ProgressFacade } from "@/application/facades/ProgressFacade";
import type { LocalProgress } from "@/application/ports/IProgressRepository";
import { renderWithProviders } from "../testUtils";

// Subject to human review — presentation screen test

const LEVEL_UUID = "550e8400-e29b-41d4-a716-446655440010";

const COMPLETED = [
  { levelId: LEVEL_UUID, score: 1500, timeSeconds: 30, movesCount: 12, completedAt: "2026-06-18T00:00:00.000Z" },
];

const PROGRESS: LocalProgress = {
  progressId: "p1",
  userId: "u1",
  version: 1,
  updatedAt: "2026-06-18T00:00:00.000Z",
  completedLevels: COMPLETED,
  pendingSync: false,
};

function makeViewModel(progress: LocalProgress = PROGRESS): ProgressViewModel {
  const facade = { load: async () => progress } as unknown as ProgressFacade;
  return new ProgressViewModel(facade);
}

describe("ProgressScreen", () => {
  it("should_show_the_level_name_when_a_mapping_exists", async () => {
    const { findByText, queryByText } = renderWithProviders(
      <ProgressScreen
        viewModel={makeViewModel()}
        userId="u1"
        levelNameById={{ [LEVEL_UUID]: "Packed Start" }}
        onBack={jest.fn()}
      />,
    );

    expect(await findByText("Packed Start")).toBeTruthy();
    expect(queryByText(LEVEL_UUID)).toBeNull();
  });

  it("should_show_a_readable_fallback_and_hide_the_uuid_when_no_mapping_exists", async () => {
    const { findByText, queryByText } = renderWithProviders(
      <ProgressScreen
        viewModel={makeViewModel()}
        userId="u1"
        levelNameById={{}}
        onBack={jest.fn()}
      />,
    );

    // A readable fallback is shown and the raw UUID is never the primary label.
    expect(await findByText("Unknown level")).toBeTruthy();
    expect(queryByText(LEVEL_UUID)).toBeNull();
  });

  it("should_show_friendly_pending_sync_copy_when_progress_is_pending", async () => {
    const { findByText } = renderWithProviders(
      <ProgressScreen
        viewModel={makeViewModel({ ...PROGRESS, pendingSync: true })}
        userId="u1"
        levelNameById={{ [LEVEL_UUID]: "Packed Start" }}
        onBack={jest.fn()}
      />,
    );

    expect(await findByText("Saved on this device — it will sync soon")).toBeTruthy();
  });

  it("should_not_show_pending_sync_copy_when_progress_is_synced", async () => {
    const { findByText, queryByText } = renderWithProviders(
      <ProgressScreen
        viewModel={makeViewModel({ ...PROGRESS, pendingSync: false })}
        userId="u1"
        levelNameById={{ [LEVEL_UUID]: "Packed Start" }}
        onBack={jest.fn()}
      />,
    );

    await findByText("Packed Start");
    expect(queryByText("Saved on this device — it will sync soon")).toBeNull();
  });
});
