/**
 * Domain errors for the board model.
 *
 * Pure domain layer: these errors never reference React, React Native, Expo,
 * HTTP, or storage. They exist so invalid board state fails in a controlled,
 * typed way instead of producing silent corruption or generic crashes.
 */
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidPositionError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class PositionOutOfBoundsError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCellSpecError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidLevelTemplateError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
