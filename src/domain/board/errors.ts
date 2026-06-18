/* eslint-disable @typescript-eslint/no-useless-constructor */
import { DomainError } from "../value-objects/errors";

/**
 * Board-specific domain errors. Extends the shared domain `DomainError` so all
 * board failures share a single base type while staying UI-agnostic.
 */
export class DuplicateCellError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class PositionNotInGraphError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
