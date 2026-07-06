import type { AuthSession } from "@/application/auth/AuthSession";
import { SessionManager } from "@/framework/session/SessionManager";
import { AsyncStorageAdapter } from "@/infrastructure/storage/AsyncStorageAdapter";
import { SecureStorageAdapter } from "@/infrastructure/storage/SecureStorageAdapter";
import { MigratingSessionStorage } from "@/infrastructure/storage/MigratingSessionStorage";

export function createSessionManager(): SessionManager {
  // The session blob (which embeds the JWT) lives in expo-secure-store; any
  // pre-existing plaintext AsyncStorage session is migrated on first read.
  const storage = new MigratingSessionStorage(
    new SecureStorageAdapter(),
    new AsyncStorageAdapter(),
  );
  return SessionManager.getInstance(storage);
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return createSessionManager().get();
}

export async function clearCurrentSession(): Promise<void> {
  await createSessionManager().clear();
}
