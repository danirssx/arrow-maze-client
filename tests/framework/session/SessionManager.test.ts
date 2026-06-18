import { SessionManager } from '@/framework/session/SessionManager';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';
import type { AuthSession } from '@/application/auth/AuthSession';

class FakeStorage implements ILocalStorage {
  private store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> { return this.store.get(key) ?? null; }
  async setItem(key: string, value: string): Promise<void> { this.store.set(key, value); }
  async removeItem(key: string): Promise<void> { this.store.delete(key); }
  async clear(): Promise<void> { this.store.clear(); }
}

const FAKE_SESSION: AuthSession = {
  userId: 'user-uuid-1',
  username: 'player',
  role: 'USER',
  accessToken: 'token-placeholder',
};

describe('SessionManager', () => {
  let storage: FakeStorage;
  let manager: SessionManager;

  beforeEach(() => {
    SessionManager.resetInstance();
    storage = new FakeStorage();
    manager = SessionManager.getInstance(storage);
  });

  it('should_return_null_when_no_session_saved', async () => {
    // Act
    const session = await manager.get();

    // Assert
    expect(session).toBeNull();
  });

  it('should_return_session_after_save', async () => {
    // Arrange & Act
    await manager.save(FAKE_SESSION);
    const session = await manager.get();

    // Assert
    expect(session?.userId).toBe('user-uuid-1');
    expect(session?.username).toBe('player');
  });

  it('should_return_null_after_clear', async () => {
    // Arrange
    await manager.save(FAKE_SESSION);

    // Act
    await manager.clear();

    // Assert
    expect(await manager.get()).toBeNull();
  });

  it('should_return_same_instance_when_called_twice', () => {
    // Act
    const a = SessionManager.getInstance(storage);
    const b = SessionManager.getInstance(storage);

    // Assert
    expect(a).toBe(b);
  });
});
