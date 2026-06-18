/**
 * Contract tests: validate that the ProgressResponse shape from the backend
 * matches what the client expects to consume.
 * Source of truth: arrow-maze-backend openApiSpec ProgressResponse schema.
 */
import { ProgressMapper } from '@/infrastructure/mappers/progress/ProgressMapper';
import type { ProgressResponseDto } from '@/infrastructure/mappers/progress/ProgressDtos';

const PROGRESS_FIXTURE: ProgressResponseDto = {
  status: 'success',
  data: {
    progressId: 'progress-550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    version: 3,
    updatedAt: '2026-06-18T00:00:00.000Z',
    completedLevels: [
      { levelId: 'level-001', score: 1500, timeSeconds: 45, movesCount: 30, completedAt: '2026-06-18T00:00:00.000Z' },
    ],
  },
};

describe('Progress contract — ProgressResponseDto', () => {
  it('should_have_status_success', () => {
    expect(PROGRESS_FIXTURE.status).toBe('success');
  });

  it('should_have_required_data_fields', () => {
    const { data } = PROGRESS_FIXTURE;
    expect(typeof data.progressId).toBe('string');
    expect(typeof data.userId).toBe('string');
    expect(typeof data.version).toBe('number');
    expect(typeof data.updatedAt).toBe('string');
    expect(Array.isArray(data.completedLevels)).toBe(true);
  });

  it('should_have_correct_completedLevel_shape', () => {
    const level = PROGRESS_FIXTURE.data.completedLevels[0];
    expect(level).toBeDefined();
    if (!level) return;
    expect(typeof level.levelId).toBe('string');
    expect(typeof level.score).toBe('number');
    expect(typeof level.timeSeconds).toBe('number');
    expect(typeof level.movesCount).toBe('number');
    expect(typeof level.completedAt).toBe('string');
  });

  it('should_parse_updatedAt_as_valid_date', () => {
    const date = new Date(PROGRESS_FIXTURE.data.updatedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  it('should_map_to_LocalProgress_via_ProgressMapper', () => {
    const local = ProgressMapper.toLocal(PROGRESS_FIXTURE);
    expect(local.userId).toBe(PROGRESS_FIXTURE.data.userId);
    expect(local.completedLevels).toHaveLength(1);
    expect(local.pendingSync).toBe(false);
  });
});
