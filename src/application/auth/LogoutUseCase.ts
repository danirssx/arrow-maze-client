import type { UseCase } from '@/application/ports/UseCase';
import type { IAuthRepository } from '@/application/ports/IAuthRepository';
import type { ISessionManager } from '@/application/ports/ISessionManager';

export class LogoutUseCase implements UseCase<void, void> {
  constructor(
    private readonly sessionManager: ISessionManager,
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(): Promise<void> {
    const session = await this.sessionManager.get();
    if (session !== null && session.refreshToken) {
      // Best-effort server-side revoke; never block local logout on a failure.
      try {
        await this.authRepository.logout(session.refreshToken);
      } catch {
        // ignore — the local session is cleared regardless.
      }
    }
    await this.sessionManager.clear();
  }
}
