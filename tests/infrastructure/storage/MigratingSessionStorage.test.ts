import type { ILocalStorage } from '@/application/ports/ILocalStorage';
import { MigratingSessionStorage } from '@/infrastructure/storage/MigratingSessionStorage';
import { StorageError } from '@/infrastructure/storage/StorageError';

const KEY = 'arrow_maze_session';

function makeFakeStorage(): jest.Mocked<ILocalStorage> {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => store.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    removeItem: jest.fn(async (k: string) => {
      store.delete(k);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  } as jest.Mocked<ILocalStorage>;
}

describe('MigratingSessionStorage', () => {
  let secure: jest.Mocked<ILocalStorage>;
  let legacy: jest.Mocked<ILocalStorage>;
  let storage: MigratingSessionStorage;

  beforeEach(() => {
    secure = makeFakeStorage();
    legacy = makeFakeStorage();
    storage = new MigratingSessionStorage(secure, legacy);
  });

  describe('setItem', () => {
    it('should_write_to_secure_and_purge_legacy_when_saving', async () => {
      // Act
      await storage.setItem(KEY, 'session-blob');

      // Assert
      expect(secure.setItem).toHaveBeenCalledWith(KEY, 'session-blob');
      expect(legacy.removeItem).toHaveBeenCalledWith(KEY);
    });
  });

  describe('getItem migration', () => {
    it('should_migrate_legacy_session_to_secure_when_secure_is_empty', async () => {
      // Arrange
      await legacy.setItem(KEY, 'legacy-session');
      legacy.setItem.mockClear();

      // Act
      const result = await storage.getItem(KEY);

      // Assert
      expect(result).toBe('legacy-session');
      expect(secure.setItem).toHaveBeenCalledWith(KEY, 'legacy-session');
      expect(legacy.removeItem).toHaveBeenCalledWith(KEY);
      expect(await secure.getItem(KEY)).toBe('legacy-session');
      expect(await legacy.getItem(KEY)).toBeNull();
    });

    it('should_read_from_secure_and_not_touch_legacy_when_secure_has_value', async () => {
      // Arrange
      await secure.setItem(KEY, 'secure-session');
      legacy.getItem.mockClear();

      // Act
      const result = await storage.getItem(KEY);

      // Assert
      expect(result).toBe('secure-session');
      expect(legacy.getItem).not.toHaveBeenCalled();
      expect(secure.setItem).toHaveBeenCalledTimes(1); // only the seed; no migration write
    });

    it('should_return_null_and_not_migrate_when_neither_store_has_value', async () => {
      // Act
      const result = await storage.getItem(KEY);

      // Assert
      expect(result).toBeNull();
      expect(secure.setItem).not.toHaveBeenCalled();
      expect(legacy.removeItem).not.toHaveBeenCalled();
    });

    it('should_keep_legacy_copy_when_secure_write_fails_during_migration', async () => {
      // Arrange
      await legacy.setItem(KEY, 'legacy-session');
      legacy.removeItem.mockClear();
      secure.setItem.mockRejectedValueOnce(new StorageError(KEY, 'keychain error'));

      // Act & Assert
      await expect(storage.getItem(KEY)).rejects.toBeInstanceOf(StorageError);
      expect(legacy.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should_remove_key_from_both_stores_when_clearing_session', async () => {
      // Act
      await storage.removeItem(KEY);

      // Assert
      expect(secure.removeItem).toHaveBeenCalledWith(KEY);
      expect(legacy.removeItem).toHaveBeenCalledWith(KEY);
    });
  });

  describe('clear', () => {
    it('should_clear_the_legacy_plaintext_store_when_called', async () => {
      // Act
      await storage.clear();

      // Assert
      expect(legacy.clear).toHaveBeenCalledTimes(1);
    });
  });
});
