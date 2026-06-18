// Pattern: Singleton — one shared session boundary across the app
import type { ISessionManager } from '@/application/ports/ISessionManager';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';
import type { AuthSession } from '@/application/auth/AuthSession';

const SESSION_KEY = 'arrow_maze_session';

export class SessionManager implements ISessionManager {
  private static instance: SessionManager | null = null;

  private constructor(private readonly storage: ILocalStorage) {}

  static getInstance(storage: ILocalStorage): SessionManager {
    if (SessionManager.instance === null) {
      SessionManager.instance = new SessionManager(storage);
    }
    return SessionManager.instance;
  }

  static resetInstance(): void {
    SessionManager.instance = null;
  }

  async save(session: AuthSession): Promise<void> {
    await this.storage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  async get(): Promise<AuthSession | null> {
    const raw = await this.storage.getItem(SESSION_KEY);
    if (raw === null) return null;
    return JSON.parse(raw) as AuthSession;
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(SESSION_KEY);
  }
}
