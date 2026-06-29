// Pattern: Decorator — secure-primary ILocalStorage with a one-time legacy → secure migration.
// Wraps a `secure` store (expo-secure-store) and a `legacy` store (AsyncStorage) so the
// session token is kept only in secure storage while existing plaintext sessions are
// transparently migrated on first read. Both collaborators are the ILocalStorage port.
import type { ILocalStorage } from '@/application/ports/ILocalStorage';

export class MigratingSessionStorage implements ILocalStorage {
  constructor(
    private readonly secure: ILocalStorage,
    private readonly legacy: ILocalStorage,
  ) {}

  async getItem(key: string): Promise<string | null> {
    const secureValue = await this.secure.getItem(key);
    if (secureValue !== null) return secureValue;

    const legacyValue = await this.legacy.getItem(key);
    if (legacyValue === null) return null;

    // One-time migration: persist to secure first, then drop the plaintext copy.
    // The legacy delete runs only after a successful secure write, so a failed
    // migration keeps the legacy session intact (no data loss / no logout).
    await this.secure.setItem(key, legacyValue);
    await this.legacy.removeItem(key);
    return legacyValue;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.secure.setItem(key, value);
    await this.legacy.removeItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await this.secure.removeItem(key);
    await this.legacy.removeItem(key);
  }

  // SecureStore has no bulk clear; only the plaintext legacy store can be wiped here.
  // Secure entries are removed by key via removeItem (logout path).
  async clear(): Promise<void> {
    await this.legacy.clear();
  }
}
