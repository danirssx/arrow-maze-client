import type { UserRole } from '@/application/auth/AuthSession';

export interface RegisterRequestDto {
  email: string;
  username: string;
  rawPassword: string;
}

export interface RegisterResponseDto {
  status: 'success';
  data: {
    userId: string;
  };
}

export interface LoginRequestDto {
  email: string;
  rawPassword: string;
}

export interface LoginResponseDto {
  status: 'success';
  data: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    username: string;
    role: UserRole;
  };
}

export interface RefreshResponseDto {
  status: 'success';
  data: {
    accessToken: string;
    refreshToken: string;
  };
}
