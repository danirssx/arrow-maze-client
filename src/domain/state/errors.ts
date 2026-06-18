import { DomainError } from "../value-objects/errors";

/**
 * State pattern — domain lifecycle errors.
 *
 * Raised when a gameplay command is not valid for the current domain state.
 * These errors are UI-agnostic and can later be mapped by application or
 * presentation layers.
 */
export class InvalidGameStateActionError extends DomainError {
  // Public constructor required because DomainError's base constructor is protected.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(message: string) {
    super(message);
  }
}

export class MissingActiveLevelError extends DomainError {
  // Public constructor required because DomainError's base constructor is protected.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(message: string) {
    super(message);
  }
}
