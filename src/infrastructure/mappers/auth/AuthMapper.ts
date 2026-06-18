// Pattern: Adapter
import type { AuthSession } from '@/application/auth/AuthSession';
import type { LoginResponseDto, RegisterResponseDto } from './AuthDtos';

export class AuthMapper {
  static toSession(dto: LoginResponseDto): AuthSession {
    return {
      userId: dto.data.userId,
      username: dto.data.username,
      role: dto.data.role,
      accessToken: dto.data.accessToken,
    };
  }

  static toRegisterOutput(dto: RegisterResponseDto): { userId: string } {
    return { userId: dto.data.userId };
  }
}
