import { DomainError } from "../value-objects/errors";

/**
 * Domain errors for the level lifecycle.
 *
 * Pure domain layer: these errors never reference React, React Native, Expo,
 * HTTP, navigation, or storage. They let an invalid level setup or an illegal
 * move fail in a controlled, typed way instead of corrupting game state.
 */
export class IllegalMoveError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidLevelStartError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class MissingExitError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidTimeLimitError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidMoveCountError extends DomainError {
  // Public constructor required because DomainError's base constructor is protected.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(message: string) {
    super(message);
  }
}
