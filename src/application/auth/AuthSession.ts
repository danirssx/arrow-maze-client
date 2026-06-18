export type UserRole = 'USER' | 'ADMIN';

export interface AuthSession {
  userId: string;
  username: string;
  role: UserRole;
  accessToken: string;
}
