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
    leaderboardId?: string;
    levelId: string;
    updatedAt?: string;
    entries: LeaderboardEntryDto[];
  };
}

// The backend derives identifiers and username from the authenticated request,
// so the client sends only the score facts produced by the game/application.
export interface SubmitScoreRequestDto {
  levelId: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
}
