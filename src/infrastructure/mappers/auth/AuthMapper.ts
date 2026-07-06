// Pattern: Adapter
import type { AuthSession } from '@/application/auth/AuthSession';
import type { RefreshTokens } from '@/application/ports/IAuthRepository';
import type { LoginResponseDto, RefreshResponseDto, RegisterResponseDto } from './AuthDtos';

export class AuthMapper {
  static toSession(dto: LoginResponseDto): AuthSession {
    return {
      userId: dto.data.userId,
      username: dto.data.username,
      role: dto.data.role,
      accessToken: dto.data.accessToken,
      refreshToken: dto.data.refreshToken,
    };
  }

  static toRefreshTokens(dto: RefreshResponseDto): RefreshTokens {
    return {
      accessToken: dto.data.accessToken,
      refreshToken: dto.data.refreshToken,
    };
  }

  static toRegisterOutput(dto: RegisterResponseDto): { userId: string } {
    return { userId: dto.data.userId };
  }
}
