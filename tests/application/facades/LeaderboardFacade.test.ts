import { GLOBAL_LEADERBOARD_ID, LeaderboardFacade } from '@/application/facades/LeaderboardFacade';
import type {
  ILeaderboardRepository,
  Leaderboard,
  LeaderboardEntry,
  SubmitScoreInput,
} from '@/application/ports/ILeaderboardRepository';

const LEVEL_UUID = '550e8400-e29b-41d4-a716-446655440010';
const LEVEL_A = '550e8400-e29b-41d4-a716-446655440020';
const LEVEL_B = '550e8400-e29b-41d4-a716-446655440021';

function entry(userId: string, score: number, extra: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    entryId: `e-${userId}`,
    userId,
    usernameSnapshot: userId,
    score,
    timeSeconds: 10,
    movesCount: 5,
    rank: 1,
    submittedAt: '2026-06-18T00:00:00.000Z',
    ...extra,
  };
}

function boardWith(levelId: string, entries: LeaderboardEntry[]): Leaderboard {
  return { leaderboardId: `lb-${levelId}`, levelId, updatedAt: '2026-06-18T00:00:00.000Z', entries };
}

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

class MapLeaderboardRepo implements ILeaderboardRepository {
  requested: string[] = [];
  constructor(private readonly byLevel: Map<string, Leaderboard | Error>) {}
  async getTopScores(levelId: string): Promise<Leaderboard> {
    this.requested.push(levelId);
    const value = this.byLevel.get(levelId);
    if (value instanceof Error) throw value;
    return value ?? boardWith(levelId, []);
  }
  async submitScore(): Promise<void> {}
}

describe('LeaderboardFacade.getGlobalScores', () => {
  it('should_sum_each_player_score_across_levels_and_rank_desc', async () => {
    const repo = new MapLeaderboardRepo(
      new Map<string, Leaderboard>([
        [LEVEL_A, boardWith(LEVEL_A, [entry('u1', 1000), entry('u2', 500)])],
        [LEVEL_B, boardWith(LEVEL_B, [entry('u1', 300), entry('u3', 900)])],
      ]),
    );
    const facade = new LeaderboardFacade(repo);

    const board = await facade.getGlobalScores([LEVEL_A, LEVEL_B]);

    expect(board.levelId).toBe(GLOBAL_LEADERBOARD_ID);
    expect(board.entries.map((e) => [e.userId, e.score, e.rank])).toEqual([
      ['u1', 1300, 1],
      ['u3', 900, 2],
      ['u2', 500, 3],
    ]);
  });

  it('should_skip_non_uuid_level_ids_without_requesting_them', async () => {
    const repo = new MapLeaderboardRepo(new Map([[LEVEL_A, boardWith(LEVEL_A, [entry('u1', 100)])]]));
    const facade = new LeaderboardFacade(repo);

    const board = await facade.getGlobalScores([LEVEL_A, 'manual-001-first-knot']);

    expect(repo.requested).toEqual([LEVEL_A]);
    expect(board.entries).toHaveLength(1);
  });

  it('should_ignore_a_failing_level_and_still_aggregate_the_rest', async () => {
    const repo = new MapLeaderboardRepo(
      new Map<string, Leaderboard | Error>([
        [LEVEL_A, boardWith(LEVEL_A, [entry('u1', 700)])],
        [LEVEL_B, new Error('network')],
      ]),
    );
    const facade = new LeaderboardFacade(repo);

    const board = await facade.getGlobalScores([LEVEL_A, LEVEL_B]);

    expect(board.entries).toEqual([expect.objectContaining({ userId: 'u1', score: 700, rank: 1 })]);
  });
});
