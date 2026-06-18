import type { UseCase } from '@/application/ports/UseCase';
import type { IAuthRepository, LoginInput } from '@/application/ports/IAuthRepository';
import type { ISessionManager } from '@/application/ports/ISessionManager';
import type { AuthSession } from './AuthSession';

export class LoginUseCase implements UseCase<LoginInput, AuthSession> {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly sessionManager: ISessionManager,
  ) {}

  async execute(input: LoginInput): Promise<AuthSession> {
    const session = await this.authRepository.login(input);
    await this.sessionManager.save(session);
    return session;
  }
}
