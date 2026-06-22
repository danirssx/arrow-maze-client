export interface CompletedLevelSnapshot {
  readonly levelId: string;
  readonly score: number;
  readonly timeSeconds: number;
  readonly movesCount: number;
  readonly completedAt: string;
}

export class CompletedLevel {
  private constructor(private readonly snapshot: CompletedLevelSnapshot) {}

  static fromSnapshot(snapshot: CompletedLevelSnapshot): CompletedLevel {
    return new CompletedLevel({ ...snapshot });
  }

  toSnapshot(): CompletedLevelSnapshot {
    return { ...this.snapshot };
  }

  sameLevelAs(other: CompletedLevel): boolean {
    return this.snapshot.levelId === other.snapshot.levelId;
  }

  isBetterThan(other: CompletedLevel): boolean {
    if (this.snapshot.score !== other.snapshot.score) {
      return this.snapshot.score > other.snapshot.score;
    }
    return this.snapshot.timeSeconds < other.snapshot.timeSeconds;
  }
}
