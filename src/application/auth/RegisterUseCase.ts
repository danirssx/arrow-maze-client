import type { UseCase } from '@/application/ports/UseCase';
import type { IAuthRepository, RegisterInput, RegisterOutput } from '@/application/ports/IAuthRepository';

export class RegisterUseCase implements UseCase<RegisterInput, RegisterOutput> {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    return this.authRepository.register(input);
  }
}
