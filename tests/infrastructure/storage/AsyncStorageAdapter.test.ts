import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageAdapter } from '@/infrastructure/storage/AsyncStorageAdapter';
import { StorageError } from '@/infrastructure/storage/StorageError';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AsyncStorageAdapter', () => {
  let adapter: AsyncStorageAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new AsyncStorageAdapter();
  });

  describe('getItem', () => {
    it('should_return_value_when_key_exists', async () => {
      // Arrange
      mockedStorage.getItem.mockResolvedValue('stored-value');

      // Act
      const result = await adapter.getItem('token');

      // Assert
      expect(result).toBe('stored-value');
    });

    it('should_return_null_when_key_missing', async () => {
      // Arrange
      mockedStorage.getItem.mockResolvedValue(null);

      // Act
      const result = await adapter.getItem('missing-key');

      // Assert
      expect(result).toBeNull();
    });

    it('should_throw_StorageError_when_read_fails', async () => {
      // Arrange
      mockedStorage.getItem.mockRejectedValue(new Error('disk error'));

      // Act & Assert
      await expect(adapter.getItem('key')).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe('setItem', () => {
    it('should_persist_value_when_called', async () => {
      // Arrange
      mockedStorage.setItem.mockResolvedValue();

      // Act
      await adapter.setItem('token', 'abc123');

      // Assert
      expect(mockedStorage.setItem).toHaveBeenCalledWith('token', 'abc123');
    });

    it('should_throw_StorageError_when_write_fails', async () => {
      // Arrange
      mockedStorage.setItem.mockRejectedValue(new Error('quota exceeded'));

      // Act & Assert
      await expect(adapter.setItem('key', 'value')).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe('removeItem', () => {
    it('should_call_removeItem_when_key_provided', async () => {
      // Arrange
      mockedStorage.removeItem.mockResolvedValue();

      // Act
      await adapter.removeItem('token');

      // Assert
      expect(mockedStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
