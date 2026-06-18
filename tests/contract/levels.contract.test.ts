/**
 * Contract tests: validate that client level catalog DTOs match the
 * expected backend response shapes for GET /levels and GET /levels/:id.
 * No real network calls — static fixtures derived from domain model
 * (LevelTemplate, CellSpec, Difficulty, Direction value objects).
 */

type CellSpecDto = {
  row: number;
  col: number;
  type: 'arrow' | 'wall' | 'empty' | 'exit';
  direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
};

type LevelDto = {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  rows: number;
  cols: number;
  cells: CellSpecDto[];
};

type LevelsListResponseDto = {
  status: 'success';
  data: {
    levels: LevelDto[];
    total: number;
  };
};

type LevelDetailResponseDto = {
  status: 'success';
  data: LevelDto;
};

const CELL_FIXTURE: CellSpecDto = {
  row: 0, col: 0, type: 'arrow', direction: 'RIGHT',
};

const LEVEL_FIXTURE: LevelDto = {
  id: 'level-001',
  title: 'The First Step',
  difficulty: 'EASY',
  rows: 5,
  cols: 5,
  cells: [CELL_FIXTURE, { row: 4, col: 4, type: 'exit' }],
};

const LEVELS_LIST_FIXTURE: LevelsListResponseDto = {
  status: 'success',
  data: { levels: [LEVEL_FIXTURE], total: 1 },
};

const LEVEL_DETAIL_FIXTURE: LevelDetailResponseDto = {
  status: 'success',
  data: LEVEL_FIXTURE,
};

describe('Levels contract — GET /levels (list)', () => {
  it('should_have_status_success', () => {
    expect(LEVELS_LIST_FIXTURE.status).toBe('success');
  });

  it('should_have_levels_array_and_total', () => {
    expect(Array.isArray(LEVELS_LIST_FIXTURE.data.levels)).toBe(true);
    expect(typeof LEVELS_LIST_FIXTURE.data.total).toBe('number');
  });

  it('should_have_correct_level_shape', () => {
    const level = LEVELS_LIST_FIXTURE.data.levels[0];
    expect(level).toBeDefined();
    if (!level) return;
    expect(typeof level.id).toBe('string');
    expect(typeof level.title).toBe('string');
    expect(['EASY', 'MEDIUM', 'HARD']).toContain(level.difficulty);
    expect(typeof level.rows).toBe('number');
    expect(typeof level.cols).toBe('number');
    expect(Array.isArray(level.cells)).toBe(true);
  });

  it('should_have_cells_with_required_fields', () => {
    const cell = LEVELS_LIST_FIXTURE.data.levels[0]?.cells[0];
    expect(cell).toBeDefined();
    if (!cell) return;
    expect(typeof cell.row).toBe('number');
    expect(typeof cell.col).toBe('number');
    expect(['arrow', 'wall', 'empty', 'exit']).toContain(cell.type);
  });

  it('should_have_direction_only_for_arrow_cells', () => {
    const arrowCell = LEVELS_LIST_FIXTURE.data.levels[0]?.cells.find((c) => c.type === 'arrow');
    const exitCell = LEVELS_LIST_FIXTURE.data.levels[0]?.cells.find((c) => c.type === 'exit');
    expect(arrowCell?.direction).toBeDefined();
    expect(exitCell?.direction).toBeUndefined();
  });
});

describe('Levels contract — GET /levels/:id (detail)', () => {
  it('should_have_status_success', () => {
    expect(LEVEL_DETAIL_FIXTURE.status).toBe('success');
  });

  it('should_have_level_data_with_id', () => {
    expect(typeof LEVEL_DETAIL_FIXTURE.data.id).toBe('string');
  });

  it('should_have_rows_and_cols_as_positive_integers', () => {
    const { rows, cols } = LEVEL_DETAIL_FIXTURE.data;
    expect(Number.isInteger(rows) && rows > 0).toBe(true);
    expect(Number.isInteger(cols) && cols > 0).toBe(true);
  });

  it('should_have_at_least_one_exit_cell', () => {
    const hasExit = LEVEL_DETAIL_FIXTURE.data.cells.some((c) => c.type === 'exit');
    expect(hasExit).toBe(true);
  });
});
