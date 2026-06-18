import { DomainError } from "../value-objects/errors";

/**
 * Command pattern — domain errors for invalid command history operations.
 */
export class EmptyCommandHistoryError extends DomainError {
  // Public constructor required because DomainError's base constructor is protected.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(message: string) {
    super(message);
  }
}

export class CommandNotExecutedError extends DomainError {
  // Public constructor required because DomainError's base constructor is protected.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(message: string) {
    super(message);
  }
}

export class CommandAlreadyExecutedError extends DomainError {
  // Public constructor required because DomainError's base constructor is protected.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(message: string) {
    super(message);
  }
}
