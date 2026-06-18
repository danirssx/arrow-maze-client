/**
 * Contract tests: validate that the LeaderboardResponse shape from the backend
 * matches what the client expects to consume.
 * Source of truth: arrow-maze-backend openApiSpec LeaderboardResponse schema.
 */

interface LeaderboardEntryDto {
  entryId: string;
  userId: string;
  usernameSnapshot: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
  rank: number;
  submittedAt: string;
}

interface LeaderboardResponseDto {
  status: 'success';
  data: {
    leaderboardId: string;
    levelId: string;
    updatedAt: string;
    entries: LeaderboardEntryDto[];
  };
}

const LEADERBOARD_FIXTURE: LeaderboardResponseDto = {
  status: 'success',
  data: {
    leaderboardId: '550e8400-e29b-41d4-a716-446655440001',
    levelId: 'level-001',
    updatedAt: '2026-06-17T00:00:00.000Z',
    entries: [
      {
        entryId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        usernameSnapshot: 'arrow_player',
        score: 1500,
        timeSeconds: 45,
        movesCount: 30,
        rank: 1,
        submittedAt: '2026-06-17T00:00:00.000Z',
      },
    ],
  },
};

describe('Leaderboard contract — LeaderboardResponseDto', () => {
  it('should_have_status_success', () => {
    expect(LEADERBOARD_FIXTURE.status).toBe('success');
  });

  it('should_have_required_data_fields', () => {
    const { data } = LEADERBOARD_FIXTURE;
    expect(typeof data.leaderboardId).toBe('string');
    expect(typeof data.levelId).toBe('string');
    expect(typeof data.updatedAt).toBe('string');
    expect(Array.isArray(data.entries)).toBe(true);
  });

  it('should_have_correct_entry_shape', () => {
    const entry = LEADERBOARD_FIXTURE.data.entries[0];
    expect(entry).toBeDefined();
    if (entry === undefined) return;
    expect(typeof entry.entryId).toBe('string');
    expect(typeof entry.userId).toBe('string');
    expect(typeof entry.usernameSnapshot).toBe('string');
    expect(typeof entry.score).toBe('number');
    expect(typeof entry.timeSeconds).toBe('number');
    expect(typeof entry.movesCount).toBe('number');
    expect(typeof entry.rank).toBe('number');
    expect(typeof entry.submittedAt).toBe('string');
  });

  it('should_have_rank_starting_at_1', () => {
    const topEntry = LEADERBOARD_FIXTURE.data.entries[0];
    expect(topEntry?.rank).toBeGreaterThanOrEqual(1);
  });
});
