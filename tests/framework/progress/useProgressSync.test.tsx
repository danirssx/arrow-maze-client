import { act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import type { AuthSession } from "@/application/auth/AuthSession";
import { useProgressSync } from "@/framework/progress/useProgressSync";
import { renderWithProviders } from "../../presentation/testUtils";

const mockUseAuthSession = jest.fn();
const mockDrainPendingProgress = jest.fn<Promise<boolean>, [string, string]>();

jest.mock("@/framework/auth/AuthGate", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock("@/framework/config/progress", () => ({
  createProgressFacade: () => ({
    drainPendingProgress: mockDrainPendingProgress,
  }),
}));

type NetInfoMock = {
  __emit: (state: { isConnected: boolean | null }) => void;
  __reset: () => void;
};

const session: AuthSession = {
  userId: "user-1",
  username: "alice",
  role: "USER",
  accessToken: "token-1",
};

function ProgressSyncProbe() {
  useProgressSync();
  return <Text testID="progress-sync-probe">ready</Text>;
}

describe("useProgressSync", () => {
  beforeEach(() => {
    const netInfo = jest.requireMock("@react-native-community/netinfo") as NetInfoMock;
    netInfo.__reset();
    mockUseAuthSession.mockReset();
    mockDrainPendingProgress.mockReset();
    mockDrainPendingProgress.mockResolvedValue(false);
  });

  it("should_drain_for_signed_in_session_when_connectivity_returns", async () => {
    const netInfo = jest.requireMock("@react-native-community/netinfo") as NetInfoMock;
    mockUseAuthSession.mockReturnValue({
      loading: false,
      session,
      refreshSession: jest.fn(),
      clearSession: jest.fn(),
    });

    renderWithProviders(<ProgressSyncProbe />);

    await waitFor(() => expect(mockDrainPendingProgress).toHaveBeenCalledWith("user-1", "token-1"));
    mockDrainPendingProgress.mockClear();

    act(() => {
      netInfo.__emit({ isConnected: true });
    });

    await waitFor(() => expect(mockDrainPendingProgress).toHaveBeenCalledWith("user-1", "token-1"));
  });
});
