import type { AuthSession } from "@/application/auth/AuthSession";
import { SessionManager } from "@/framework/session/SessionManager";
import { AsyncStorageAdapter } from "@/infrastructure/storage/AsyncStorageAdapter";

export function createSessionManager(): SessionManager {
  return SessionManager.getInstance(new AsyncStorageAdapter());
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return createSessionManager().get();
}
