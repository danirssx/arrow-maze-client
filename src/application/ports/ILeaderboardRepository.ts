export interface LeaderboardEntry {
  entryId: string;
  userId: string;
  usernameSnapshot: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
  rank: number;
  submittedAt: string;
}

export interface Leaderboard {
  leaderboardId: string;
  levelId: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
}

export interface SubmitScoreInput {
  leaderboardId: string;
  entryId: string;
  levelId: string;
  usernameSnapshot: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
}

export interface ILeaderboardRepository {
  getTopScores(levelId: string): Promise<Leaderboard>;
  submitScore(input: SubmitScoreInput, accessToken: string): Promise<void>;
}
