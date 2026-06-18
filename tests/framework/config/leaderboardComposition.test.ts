import { createHttpClient } from "@/framework/config/httpClient";
import { createLeaderboardViewModel } from "@/framework/config/leaderboard";
import { LeaderboardViewModel } from "@/presentation/view-models/LeaderboardViewModel";

describe("leaderboard composition root", () => {
  it("should_create_an_http_client_exposing_the_verbs", () => {
    const client = createHttpClient();

    expect(typeof client.get).toBe("function");
    expect(typeof client.post).toBe("function");
  });

  it("should_build_a_leaderboard_view_model_wired_to_the_backend", () => {
    expect(createLeaderboardViewModel()).toBeInstanceOf(LeaderboardViewModel);
  });
});
