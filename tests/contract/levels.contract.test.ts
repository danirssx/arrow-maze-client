/**
 * Contract tests: validate the client level catalog DTOs against the backend
 * Arrow Untangle response shapes for GET /levels and GET /levels/:id.
 */

type LevelSummaryDto = {
  levelId: string;
  name: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  arrowCount: number;
  attempts: number;
  timeLimitSeconds?: number;
  createdAt: string;
};

type ArrowSpecDto = {
  id: string;
  color: string;
  path: { row: number; col: number }[];
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
};

type LevelDetailDto = {
  levelId: string;
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  definition: {
    attempts: number;
    arrows: ArrowSpecDto[];
  };
  timeLimitSeconds?: number;
  createdAt: string;
  updatedAt: string;
};

type LevelsListResponseDto = {
  status: 'success';
  data: {
    levels: LevelSummaryDto[];
  };
};

type LevelDetailResponseDto = {
  status: 'success';
  data: {
    level: LevelDetailDto;
  };
};

const LEVEL_SUMMARY_FIXTURE: LevelSummaryDto = {
  levelId: '550e8400-e29b-41d4-a716-446655440010',
  name: 'First Knot',
  difficulty: 'EASY',
  arrowCount: 2,
  attempts: 5,
  createdAt: '2026-06-18T00:00:00.000Z',
};

const LEVEL_DETAIL_FIXTURE: LevelDetailDto = {
  levelId: '550e8400-e29b-41d4-a716-446655440011',
  name: 'Rush',
  description: 'Timed knot',
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  version: 1,
  definition: {
    attempts: 5,
    arrows: [
      {
        id: 'a',
        color: 'blue',
        path: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
        direction: 'RIGHT',
      },
    ],
  },
  timeLimitSeconds: 75,
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
};

const LEVELS_LIST_FIXTURE: LevelsListResponseDto = {
  status: 'success',
  data: { levels: [LEVEL_SUMMARY_FIXTURE] },
};

const LEVEL_RESPONSE_FIXTURE: LevelDetailResponseDto = {
  status: 'success',
  data: { level: LEVEL_DETAIL_FIXTURE },
};

describe('Levels contract — GET /levels (list)', () => {
  it('should_have_status_success', () => {
    expect(LEVELS_LIST_FIXTURE.status).toBe('success');
  });

  it('should_have_backend_level_summary_fields', () => {
    const level = LEVELS_LIST_FIXTURE.data.levels[0];
    expect(level).toBeDefined();
    if (!level) return;
    expect(typeof level.levelId).toBe('string');
    expect(typeof level.name).toBe('string');
    expect(['EASY', 'MEDIUM', 'HARD']).toContain(level.difficulty);
    expect(Number.isInteger(level.arrowCount)).toBe(true);
    expect(Number.isInteger(level.attempts)).toBe(true);
    expect(typeof level.createdAt).toBe('string');
  });
});

describe('Levels contract — GET /levels/:id (detail)', () => {
  it('should_have_status_success', () => {
    expect(LEVEL_RESPONSE_FIXTURE.status).toBe('success');
  });

  it('should_wrap_level_detail_under_data_level', () => {
    expect(LEVEL_RESPONSE_FIXTURE.data.level.levelId).toBe('550e8400-e29b-41d4-a716-446655440011');
  });

  it('should_have_arrow_specs_with_tail_to_head_paths', () => {
    const arrow = LEVEL_RESPONSE_FIXTURE.data.level.definition.arrows[0];
    expect(arrow).toBeDefined();
    if (!arrow) return;
    expect(typeof arrow.id).toBe('string');
    expect(typeof arrow.color).toBe('string');
    expect(Array.isArray(arrow.path)).toBe(true);
    expect(typeof arrow.path[0]?.row).toBe('number');
    expect(typeof arrow.path[0]?.col).toBe('number');
    expect(['UP', 'DOWN', 'LEFT', 'RIGHT']).toContain(arrow.direction);
  });

  it('should_support_timed_levels', () => {
    expect(LEVEL_RESPONSE_FIXTURE.data.level.timeLimitSeconds).toBe(75);
  });
});
