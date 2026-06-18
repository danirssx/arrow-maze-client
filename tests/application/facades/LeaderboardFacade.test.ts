import { LeaderboardFacade } from '@/application/facades/LeaderboardFacade';
import type { ILeaderboardRepository, Leaderboard, SubmitScoreInput } from '@/application/ports/ILeaderboardRepository';

const LEADERBOARD: Leaderboard = {
  leaderboardId: 'lb-1', levelId: 'level-001', updatedAt: '2026-06-18T00:00:00.000Z',
  entries: [{ entryId: 'e-1', userId: 'user-1', usernameSnapshot: 'player', score: 1500, timeSeconds: 45, movesCount: 30, rank: 1, submittedAt: '2026-06-18T00:00:00.000Z' }],
};

class FakeLeaderboardRepo implements ILeaderboardRepository {
  submitted: SubmitScoreInput | null = null;
  submittedAccessToken: string | null = null;
  async getTopScores(_levelId: string): Promise<Leaderboard> { return LEADERBOARD; }
  async submitScore(input: SubmitScoreInput, accessToken: string): Promise<void> {
    this.submitted = input;
    this.submittedAccessToken = accessToken;
  }
}

describe('LeaderboardFacade', () => {
  let repo: FakeLeaderboardRepo;
  let facade: LeaderboardFacade;

  beforeEach(() => {
    repo = new FakeLeaderboardRepo();
    facade = new LeaderboardFacade(repo);
  });

  it('should_return_leaderboard_with_entries', async () => {
    const result = await facade.getTopScores('level-001');
    expect(result.levelId).toBe('level-001');
    expect(result.entries).toHaveLength(1);
  });

  it('should_delegate_submit_score_to_repository', async () => {
    const input: SubmitScoreInput = {
      leaderboardId: 'lb-1', entryId: 'e-2',
      levelId: 'level-001', usernameSnapshot: 'player',
      score: 800, timeSeconds: 60, movesCount: 20,
    };
    await facade.submitScore(input, 'jwt-token-1');
    expect(repo.submitted?.score).toBe(800);
    expect(repo.submitted).not.toHaveProperty('userId');
    expect(repo.submittedAccessToken).toBe('jwt-token-1');
  });
});
