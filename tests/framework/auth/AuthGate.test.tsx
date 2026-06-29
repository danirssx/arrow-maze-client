import { fireEvent, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import type { AuthSession } from "@/application/auth/AuthSession";
import { AuthGate, useAuthSession } from "@/framework/auth/AuthGate";
import { renderWithProviders } from "../../presentation/testUtils";

const mockRedirects: string[] = [];
let mockSegments: string[] = ["index"];
const mockGetCurrentSession = jest.fn<Promise<AuthSession | null>, []>();
const mockClearCurrentSession = jest.fn<Promise<void>, []>();

jest.mock("expo-router", () => {
  return {
    Redirect: ({ href }: { href: string }) => {
      mockRedirects.push(String(href));
      return null;
    },
    useSegments: () => mockSegments,
  };
});

jest.mock("@/framework/config/session", () => ({
  getCurrentSession: () => mockGetCurrentSession(),
  clearCurrentSession: () => mockClearCurrentSession(),
}));

const session: AuthSession = {
  userId: "u1",
  username: "alice",
  role: "USER",
  accessToken: "token-1",
};

function ProtectedContent() {
  return <Text testID="protected-content">Protected</Text>;
}

function LogoutProbe() {
  const { clearSession } = useAuthSession();
  return (
    <Pressable testID="logout-probe" onPress={() => void clearSession()}>
      <Text>Log out</Text>
    </Pressable>
  );
}

describe("AuthGate", () => {
  beforeEach(() => {
    mockRedirects.length = 0;
    mockSegments = ["index"];
    mockGetCurrentSession.mockReset();
    mockClearCurrentSession.mockReset();
    mockClearCurrentSession.mockResolvedValue(undefined);
  });

  it("should_redirect_to_login_when_protected_route_has_no_session", async () => {
    // Arrange
    mockGetCurrentSession.mockResolvedValue(null);

    // Act
    const screen = renderWithProviders(
      <AuthGate>
        <ProtectedContent />
      </AuthGate>,
    );

    // Assert
    await waitFor(() => expect(mockRedirects).toContain("/login"));
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("should_render_protected_content_when_session_bootstraps", async () => {
    // Arrange
    mockGetCurrentSession.mockResolvedValue(session);

    // Act
    const screen = renderWithProviders(
      <AuthGate>
        <ProtectedContent />
      </AuthGate>,
    );

    // Assert
    await waitFor(() => expect(screen.getByTestId("protected-content")).toBeTruthy());
    expect(mockRedirects).not.toContain("/login");
  });

  it("should_clear_session_and_redirect_to_login_when_logout_runs", async () => {
    // Arrange
    mockGetCurrentSession.mockResolvedValue(session);

    // Act
    const screen = renderWithProviders(
      <AuthGate>
        <LogoutProbe />
      </AuthGate>,
    );
    await waitFor(() => expect(screen.getByTestId("logout-probe")).toBeTruthy());
    fireEvent.press(screen.getByTestId("logout-probe"));

    // Assert
    await waitFor(() => expect(mockClearCurrentSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRedirects).toContain("/login"));
  });

  it("should_redirect_authenticated_users_away_from_login", async () => {
    // Arrange
    mockSegments = ["login"];
    mockGetCurrentSession.mockResolvedValue(session);

    // Act
    renderWithProviders(
      <AuthGate>
        <ProtectedContent />
      </AuthGate>,
    );

    // Assert
    await waitFor(() => expect(mockRedirects).toContain("/"));
  });

  it("should_redirect_to_login_when_game_route_has_no_session", async () => {
    // Arrange
    mockSegments = ["game"];
    mockGetCurrentSession.mockResolvedValue(null);

    // Act
    renderWithProviders(
      <AuthGate>
        <ProtectedContent />
      </AuthGate>,
    );

    // Assert
    await waitFor(() => expect(mockRedirects).toContain("/login"));
  });
});
