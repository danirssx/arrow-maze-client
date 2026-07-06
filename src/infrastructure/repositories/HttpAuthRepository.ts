// Pattern: Adapter, Repository
import type { IAuthRepository, RegisterInput, RegisterOutput, LoginInput, RefreshTokens } from '@/application/ports/IAuthRepository';
import type { IHttpClient } from '@/application/ports/IHttpClient';
import type { AuthSession } from '@/application/auth/AuthSession';
import type { LoginResponseDto, RefreshResponseDto, RegisterResponseDto } from '@/infrastructure/mappers/auth/AuthDtos';
import { AuthMapper } from '@/infrastructure/mappers/auth/AuthMapper';

export class HttpAuthRepository implements IAuthRepository {
  constructor(private readonly http: IHttpClient) {}

  async register(input: RegisterInput): Promise<RegisterOutput> {
    const res = await this.http.post<RegisterResponseDto>('/auth/register', {
      email: input.email,
      username: input.username,
      rawPassword: input.rawPassword,
    });
    return AuthMapper.toRegisterOutput(res.data);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const res = await this.http.post<LoginResponseDto>('/auth/login', {
      email: input.email,
      rawPassword: input.rawPassword,
    });
    return AuthMapper.toSession(res.data);
  }

  // /auth/refresh and /auth/logout carry no Authorization header, so the http
  // client's 401-refresh-retry guard never loops on them.
  async refresh(refreshToken: string): Promise<RefreshTokens> {
    const res = await this.http.post<RefreshResponseDto>('/auth/refresh', { refreshToken });
    return AuthMapper.toRefreshTokens(res.data);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.http.post('/auth/logout', { refreshToken });
  }
}
