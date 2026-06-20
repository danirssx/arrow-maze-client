/* eslint-disable @typescript-eslint/no-useless-constructor */
import { DomainError } from "../value-objects/errors";

/**
 * Domain errors for the level lifecycle (arrow untangle engine).
 *
 * Pure domain layer: these errors never reference React, React Native, Expo,
 * HTTP, navigation, or storage. They let an invalid level setup or an illegal
 * extraction fail in a controlled, typed way instead of corrupting game state.
 */
export class InvalidTimeLimitError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidAttemptsError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class ArrowNotExtractableError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
