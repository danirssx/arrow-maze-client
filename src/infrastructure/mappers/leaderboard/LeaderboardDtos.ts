export interface LeaderboardEntryDto {
  entryId: string;
  userId: string;
  usernameSnapshot: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
  rank: number;
  submittedAt: string;
}

export interface LeaderboardResponseDto {
  status: 'success';
  data: {
    leaderboardId: string;
    levelId: string;
    updatedAt: string;
    entries: LeaderboardEntryDto[];
  };
}

export interface SubmitScoreRequestDto {
  leaderboardId: string;
  entryId: string;
  userId: string;
  levelId: string;
  usernameSnapshot: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
}
