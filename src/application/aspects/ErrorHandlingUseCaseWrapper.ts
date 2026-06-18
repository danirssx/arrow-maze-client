// Pattern: AOP wrapper — centralised error normalisation across use cases
import type { UseCase } from '@/application/ports/UseCase';
import type { Logger } from '@/application/ports/Logger';

export type ErrorHandler = (err: unknown) => never;

export class ErrorHandlingUseCaseWrapper<TInput, TOutput> implements UseCase<TInput, TOutput> {
  constructor(
    private readonly inner: UseCase<TInput, TOutput>,
    private readonly onError: ErrorHandler,
    private readonly logger?: Logger,
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    try {
      return await this.inner.execute(input);
    } catch (err) {
      this.logger?.error('Unhandled use case error', {
        message: err instanceof Error ? err.message : String(err),
      });
      this.onError(err);
    }
  }
}
