/* eslint-disable @typescript-eslint/no-useless-constructor */
/**
 * Domain errors for the value-object layer.
 *
 * Pure domain layer: these errors never reference React, React Native, Expo,
 * HTTP, or storage. They exist so invalid value-object state fails in a
 * controlled, typed way instead of producing silent corruption or generic
 * crashes.
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

export class InvalidDirectionError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidArrowSpecError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidBoundingBoxError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidScoreError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
