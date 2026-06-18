/**
 * Application errors for gameplay orchestration.
 *
 * These errors belong to the application layer and stay independent from UI,
 * navigation, storage, or HTTP. They protect use cases and facades from being
 * called before a level session exists.
 */
export class GameplayStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
