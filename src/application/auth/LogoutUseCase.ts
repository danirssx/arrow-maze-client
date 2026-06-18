import type { UseCase } from '@/application/ports/UseCase';
import type { ISessionManager } from '@/application/ports/ISessionManager';

export class LogoutUseCase implements UseCase<void, void> {
  constructor(private readonly sessionManager: ISessionManager) {}

  async execute(): Promise<void> {
    await this.sessionManager.clear();
  }
}
