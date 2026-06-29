import type { AuthSession } from '@/application/auth/AuthSession';

export interface RegisterInput {
  email: string;
  username: string;
  rawPassword: string;
}

export interface RegisterOutput {
  userId: string;
}

export interface LoginInput {
  email: string;
  rawPassword: string;
}

export interface RefreshTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthRepository {
  register(input: RegisterInput): Promise<RegisterOutput>;
  login(input: LoginInput): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<RefreshTokens>;
  logout(refreshToken: string): Promise<void>;
}
