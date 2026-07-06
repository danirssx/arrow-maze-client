import { LeaderboardFacade } from '@/application/facades/LeaderboardFacade';
import type { ILeaderboardRepository, Leaderboard, SubmitScoreInput } from '@/application/ports/ILeaderboardRepository';

const LEVEL_UUID = '550e8400-e29b-41d4-a716-446655440010';

const LEADERBOARD: Leaderboard = {
  leaderboardId: 'lb-1', levelId: LEVEL_UUID, updatedAt: '2026-06-18T00:00:00.000Z',
  entries: [{ entryId: 'e-1', userId: 'user-1', usernameSnapshot: 'player', score: 1500, timeSeconds: 45, movesCount: 30, rank: 1, submittedAt: '2026-06-18T00:00:00.000Z' }],
};

class FakeLeaderboardRepo implements ILeaderboardRepository {
  submitted: SubmitScoreInput | null = null;
  submitCalls = 0;
  async getTopScores(_levelId: string): Promise<Leaderboard> { return LEADERBOARD; }
  async submitScore(input: SubmitScoreInput): Promise<void> {
    this.submitCalls += 1;
    this.submitted = input;
  }
}

const submitInput = (levelId: string): SubmitScoreInput => ({
  levelId,
  score: 800, timeSeconds: 60, movesCount: 20,
});

describe('LeaderboardFacade', () => {
  let repo: FakeLeaderboardRepo;
  let facade: LeaderboardFacade;

  beforeEach(() => {
    repo = new FakeLeaderboardRepo();
    facade = new LeaderboardFacade(repo);
  });

  it('should_return_leaderboard_with_entries', async () => {
    const result = await facade.getTopScores(LEVEL_UUID);
    expect(result.levelId).toBe(LEVEL_UUID);
    expect(result.entries).toHaveLength(1);
  });

  it('should_delegate_submit_score_to_repository_when_level_id_is_a_uuid', async () => {
    await facade.submitScore(submitInput(LEVEL_UUID));
    expect(repo.submitted?.score).toBe(800);
    expect(repo.submitted).not.toHaveProperty('userId');
    expect(repo.submitted).not.toHaveProperty('leaderboardId');
    expect(repo.submitted).not.toHaveProperty('entryId');
    expect(repo.submitted).not.toHaveProperty('usernameSnapshot');
  });

  it('should_not_submit_score_when_level_id_is_not_a_uuid', async () => {
    await facade.submitScore(submitInput('manual-001-first-knot'));
    expect(repo.submitCalls).toBe(0);
    expect(repo.submitted).toBeNull();
  });
});
