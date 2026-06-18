import { InvalidScoreError } from "./errors";

/**
 * Score value object (immutable).
 *
 * A final game score as a non-negative integer of points. Construction is
 * validated through `Score.of`, so a negative or non-integer score fails in a
 * controlled way (`InvalidScoreError`) instead of leaking an invalid high score.
 * Arithmetic returns new instances, keeping scoring strategies deterministic and
 * side-effect free.
 */
export class Score {
  private constructor(readonly value: number) {}

  static of(value: number): Score {
    if (!Number.isInteger(value)) {
      throw new InvalidScoreError(`Score must be an integer, received ${value}.`);
    }
    if (value < 0) {
      throw new InvalidScoreError(`Score must be non-negative, received ${value}.`);
    }
    return new Score(value);
  }

  static zero(): Score {
    return new Score(0);
  }

  add(points: number): Score {
    return Score.of(this.value + points);
  }

  equals(other: Score): boolean {
    return this.value === other.value;
  }
}
