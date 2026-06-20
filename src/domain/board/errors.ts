/* eslint-disable @typescript-eslint/no-useless-constructor */
import { DomainError } from "../value-objects/errors";

/**
 * Board-specific domain errors for the arrow untangle engine. They extend the
 * shared `DomainError` so every board failure shares one UI-agnostic base type.
 */
export class DuplicateArrowError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class ArrowNotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
