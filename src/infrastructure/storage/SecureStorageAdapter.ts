// Pattern: Adapter — wraps the native expo-secure-store keychain behind ILocalStorage
import * as SecureStore from 'expo-secure-store';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';
import { StorageError } from './StorageError';

export class SecureStorageAdapter implements ILocalStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      throw new StorageError(key, `Failed to read secure key "${key}"`, err);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      throw new StorageError(key, `Failed to write secure key "${key}"`, err);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      throw new StorageError(key, `Failed to remove secure key "${key}"`, err);
    }
  }

  // SecureStore keeps each value under its own keychain entry and exposes no
  // clear-all API, so a bulk clear cannot be honored. The session flow only ever
  // removes a single key (logout uses removeItem), so this is never reached.
  async clear(): Promise<void> {
    throw new StorageError('__all__', 'SecureStore does not support clearing all keys');
  }
}
