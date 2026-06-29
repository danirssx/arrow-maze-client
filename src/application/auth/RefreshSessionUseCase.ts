import type { UseCase } from '@/application/ports/UseCase';
import type { IAuthRepository } from '@/application/ports/IAuthRepository';
import type { ISessionManager } from '@/application/ports/ISessionManager';

/**
 * Exchanges the stored refresh token for a new access token, rotating the
 * persisted session. Returns the new access token, or `null` when there is no
 * refresh token to use or the backend rejects it (the caller then falls back to
 * clearing the session / logging out).
 */
export class RefreshSessionUseCase implements UseCase<void, string | null> {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly sessionManager: ISessionManager,
  ) {}

  async execute(): Promise<string | null> {
    const session = await this.sessionManager.get();
    if (session === null || !session.refreshToken) {
      return null;
    }

    try {
      const tokens = await this.authRepository.refresh(session.refreshToken);
      await this.sessionManager.save({
        ...session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      return tokens.accessToken;
    } catch {
      return null;
    }
  }
}
