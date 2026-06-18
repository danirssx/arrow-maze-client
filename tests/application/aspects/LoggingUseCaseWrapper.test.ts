import { LoggingUseCaseWrapper } from '@/application/aspects/LoggingUseCaseWrapper';
import type { UseCase } from '@/application/ports/UseCase';
import type { Logger } from '@/application/ports/Logger';

class FakeUseCase implements UseCase<string, string> {
  shouldFail = false;
  async execute(input: string): Promise<string> {
    if (this.shouldFail) throw new Error('use case failed');
    return `result:${input}`;
  }
}

class FakeLogger implements Logger {
  infos: string[] = [];
  errors: string[] = [];
  warns: string[] = [];
  info(message: string): void { this.infos.push(message); }
  error(message: string): void { this.errors.push(message); }
  warn(message: string): void { this.warns.push(message); }
}

describe('LoggingUseCaseWrapper', () => {
  it('should_log_start_and_success_when_use_case_succeeds', async () => {
    // Arrange
    const inner = new FakeUseCase();
    const logger = new FakeLogger();
    const wrapper = new LoggingUseCaseWrapper(inner, logger, 'TestUseCase');

    // Act
    const result = await wrapper.execute('hello');

    // Assert
    expect(result).toBe('result:hello');
    expect(logger.infos).toContain('[TestUseCase] start');
    expect(logger.infos).toContain('[TestUseCase] success');
  });

  it('should_log_error_and_rethrow_when_use_case_fails', async () => {
    // Arrange
    const inner = new FakeUseCase();
    inner.shouldFail = true;
    const logger = new FakeLogger();
    const wrapper = new LoggingUseCaseWrapper(inner, logger, 'TestUseCase');

    // Act & Assert
    await expect(wrapper.execute('x')).rejects.toThrow('use case failed');
    expect(logger.errors.length).toBeGreaterThan(0);
  });

  it('should_not_log_input_values_to_prevent_token_leakage', async () => {
    // Arrange
    const inner = new FakeUseCase();
    const logger = new FakeLogger();
    const wrapper = new LoggingUseCaseWrapper(inner, logger, 'AuthUseCase');

    // Act
    await wrapper.execute('secret-token-value');

    // Assert — input never appears in logs
    const allLogs = [...logger.infos, ...logger.errors, ...logger.warns].join(' ');
    expect(allLogs).not.toContain('secret-token-value');
  });
});
