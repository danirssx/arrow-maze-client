/**
 * Command pattern — reversible domain command contract.
 *
 * Encapsulates one gameplay action and its deterministic rollback. Concrete
 * commands must leave aggregate state untouched when execution fails.
 */
export interface ICommand<TResult = void> {
  execute(): TResult;
  undo(): void;
}
