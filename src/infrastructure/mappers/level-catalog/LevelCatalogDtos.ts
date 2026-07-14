export interface LevelSummaryDto {
  levelId: string;
  name: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  arrowCount: number;
  attempts: number;
  timeLimitSeconds?: number;
  createdAt: string;
}

export interface LevelsResponseDto {
  status: "success";
  data: {
    levels: LevelSummaryDto[];
  };
}

export interface LevelArrowDto {
  id: string;
  color: string;
  /** Lattice cells tail→head; `z` (depth) is optional and defaults to 0 for planar (2D) levels. */
  path: { row: number; col: number; z?: number }[];
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT" | "FORWARD" | "BACK";
}

/** Optional abstract board mask (Option A) as returned by the backend. */
export interface BoardShapeDto {
  type: string;
  cells: { row: number; col: number; z?: number }[];
}

export interface LevelDetailDto {
  levelId: string;
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: string;
  version: number;
  definition: {
    attempts: number;
    arrows: LevelArrowDto[];
    boardShape?: BoardShapeDto;
  };
  /** Board dimensionality; absent means a planar (2D) level. */
  dimensions?: 2 | 3;
  timeLimitSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LevelResponseDto {
  status: "success";
  data: {
    level: LevelDetailDto;
  };
}
