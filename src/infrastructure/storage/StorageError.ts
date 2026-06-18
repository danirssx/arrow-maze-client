export class StorageError extends Error {
  constructor(
    public readonly key: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
