/* eslint-disable @typescript-eslint/no-useless-constructor */
/**
 * Application errors for level building.
 *
 * Application layer: these errors never reference React, React Native, Expo,
 * HTTP, or storage. They let a malformed level definition or an unsolvable board
 * fail in a controlled, typed way at the application boundary instead of leaking
 * raw domain or parser errors to callers.
 */
export abstract class ApplicationError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** A level definition is missing data, malformed, or otherwise not buildable. */
export class InvalidLevelDefinitionError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}

/** A structurally valid level has no path from its start to its exit. */
export class UnsolvableLevelError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}

/** The builder was driven out of order (e.g. `build()` before a template was set). */
export class LevelBuildStateError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}
