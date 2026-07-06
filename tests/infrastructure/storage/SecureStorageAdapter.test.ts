import * as SecureStore from 'expo-secure-store';
import { SecureStorageAdapter } from '@/infrastructure/storage/SecureStorageAdapter';
import { StorageError } from '@/infrastructure/storage/StorageError';

const mockedSecureStore = SecureStore as unknown as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
  __resetStore: () => void;
};

describe('SecureStorageAdapter', () => {
  let adapter: SecureStorageAdapter;

  beforeEach(() => {
    mockedSecureStore.__resetStore();
    adapter = new SecureStorageAdapter();
  });

  describe('getItem', () => {
    it('should_return_value_when_key_exists', async () => {
      // Arrange
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('stored-value');

      // Act
      const result = await adapter.getItem('arrow_maze_session');

      // Assert
      expect(result).toBe('stored-value');
      expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('arrow_maze_session');
    });

    it('should_return_null_when_key_missing', async () => {
      // Arrange
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      // Act
      const result = await adapter.getItem('missing-key');

      // Assert
      expect(result).toBeNull();
    });

    it('should_throw_StorageError_when_read_fails', async () => {
      // Arrange
      mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('keychain error'));

      // Act & Assert
      await expect(adapter.getItem('key')).rejects.toThrow('Failed to read secure key "key"');
    });
  });

  describe('setItem', () => {
    it('should_persist_value_via_secure_store_when_called', async () => {
      // Act
      await adapter.setItem('arrow_maze_session', 'abc123');

      // Assert
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('arrow_maze_session', 'abc123');
    });

    it('should_throw_StorageError_when_write_fails', async () => {
      // Arrange
      mockedSecureStore.setItemAsync.mockRejectedValueOnce(new Error('keychain full'));

      // Act & Assert
      await expect(adapter.setItem('key', 'value')).rejects.toThrow('Failed to write secure key "key"');
    });
  });

  describe('removeItem', () => {
    it('should_delete_via_secure_store_when_key_provided', async () => {
      // Act
      await adapter.removeItem('arrow_maze_session');

      // Assert
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('arrow_maze_session');
    });

    it('should_throw_StorageError_when_delete_fails', async () => {
      // Arrange
      mockedSecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('keychain error'));

      // Act & Assert
      await expect(adapter.removeItem('key')).rejects.toThrow('Failed to remove secure key "key"');
    });
  });

  describe('clear', () => {
    it('should_throw_StorageError_when_called_because_secure_store_has_no_bulk_clear', async () => {
      // Act & Assert
      await expect(adapter.clear()).rejects.toBeInstanceOf(StorageError);
      await expect(adapter.clear()).rejects.toThrow('SecureStore does not support clearing all keys');
    });
  });
});
