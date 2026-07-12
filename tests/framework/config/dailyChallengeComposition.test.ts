import {
  createDailyChallengeFacade,
  createDailyChallengeViewModel,
} from "@/framework/config/dailyChallenge";
import { DailyChallengeFacade } from "@/application/facades/DailyChallengeFacade";
import { DailyChallengeViewModel } from "@/presentation/view-models/DailyChallengeViewModel";

describe("daily challenge composition root", () => {
  it("should_build_a_facade_wired_to_the_backend", () => {
    expect(createDailyChallengeFacade()).toBeInstanceOf(DailyChallengeFacade);
  });

  it("should_build_a_view_model_wired_to_the_backend", () => {
    expect(createDailyChallengeViewModel()).toBeInstanceOf(DailyChallengeViewModel);
  });
});
