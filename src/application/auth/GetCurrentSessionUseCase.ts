import type { UseCase } from '@/application/ports/UseCase';
import type { ISessionManager } from '@/application/ports/ISessionManager';
import type { AuthSession } from './AuthSession';

export class GetCurrentSessionUseCase implements UseCase<void, AuthSession | null> {
  constructor(private readonly sessionManager: ISessionManager) {}

  async execute(): Promise<AuthSession | null> {
    return this.sessionManager.get();
  }
}
