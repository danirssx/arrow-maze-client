import type { AuthSession } from '@/application/auth/AuthSession';

export interface ISessionManager {
  save(session: AuthSession): Promise<void>;
  get(): Promise<AuthSession | null>;
  clear(): Promise<void>;
}
