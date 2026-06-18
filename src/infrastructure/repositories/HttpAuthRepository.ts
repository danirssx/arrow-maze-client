// Pattern: Adapter, Repository
import type { IAuthRepository, RegisterInput, RegisterOutput, LoginInput } from '@/application/ports/IAuthRepository';
import type { IHttpClient } from '@/application/ports/IHttpClient';
import type { AuthSession } from '@/application/auth/AuthSession';
import type { LoginResponseDto, RegisterResponseDto } from '@/infrastructure/mappers/auth/AuthDtos';
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
}
