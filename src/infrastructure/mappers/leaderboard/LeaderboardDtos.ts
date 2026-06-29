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

// The backend derives userId from the authenticated JWT, so the request body
// never carries it; keeping a userId field here was dead and misleading.
export interface SubmitScoreRequestDto {
  leaderboardId: string;
  entryId: string;
  levelId: string;
  usernameSnapshot: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
}
