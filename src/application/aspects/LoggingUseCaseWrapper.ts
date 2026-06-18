// Pattern: AOP wrapper — cross-cutting logging without modifying use case logic
import type { UseCase } from '@/application/ports/UseCase';
import type { Logger } from '@/application/ports/Logger';

export class LoggingUseCaseWrapper<TInput, TOutput> implements UseCase<TInput, TOutput> {
  constructor(
    private readonly inner: UseCase<TInput, TOutput>,
    private readonly logger: Logger,
    private readonly useCaseName: string,
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    this.logger.info(`[${this.useCaseName}] start`);
    try {
      const result = await this.inner.execute(input);
      this.logger.info(`[${this.useCaseName}] success`);
      return result;
    } catch (err) {
      this.logger.error(`[${this.useCaseName}] error`, {
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
