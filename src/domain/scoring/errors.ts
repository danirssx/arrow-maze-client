import { DomainError } from "../value-objects/errors";

/**
 * Domain errors for scoring.
 *
 * Pure domain layer: never reference UI, storage, or the backend. They make an
 * inconsistent scoring input fail in a controlled, typed way instead of silently
 * producing an invalid score.
 */
export class InvalidScoreContextError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
