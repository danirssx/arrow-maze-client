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
  path: { row: number; col: number }[];
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
}

/** Optional abstract board mask (Option A) as returned by the backend. */
export interface BoardShapeDto {
  type: string;
  cells: { row: number; col: number }[];
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
