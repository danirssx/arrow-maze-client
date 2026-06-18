// Pattern: Adapter
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';
import { StorageError } from './StorageError';

export class AsyncStorageAdapter implements ILocalStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      throw new StorageError(key, `Failed to read key "${key}"`, err);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      throw new StorageError(key, `Failed to write key "${key}"`, err);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      throw new StorageError(key, `Failed to remove key "${key}"`, err);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (err) {
      throw new StorageError('__all__', 'Failed to clear storage', err);
    }
  }
}
