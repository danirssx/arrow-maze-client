import { GetCurrentSessionUseCase } from "@/application/auth/GetCurrentSessionUseCase";
import { LoginUseCase } from "@/application/auth/LoginUseCase";
import { LogoutUseCase } from "@/application/auth/LogoutUseCase";
import { RegisterUseCase } from "@/application/auth/RegisterUseCase";
import { HttpAuthRepository } from "@/infrastructure/repositories/HttpAuthRepository";
import { AsyncStorageAdapter } from "@/infrastructure/storage/AsyncStorageAdapter";
import { SessionManager } from "@/framework/session/SessionManager";
import { AuthViewModel } from "@/presentation/view-models/AuthViewModel";
import { createHttpClient } from "./httpClient";

/**
 * Composition root (framework) for the auth flow: wires the HTTP auth repository
 * and the persistent `SessionManager` into the auth use cases and the
 * `AuthViewModel` the login route renders.
 */
export function createAuthViewModel(): AuthViewModel {
  const authRepository = new HttpAuthRepository(createHttpClient());
  const sessionManager = SessionManager.getInstance(new AsyncStorageAdapter());
  return new AuthViewModel(
    new LoginUseCase(authRepository, sessionManager),
    new RegisterUseCase(authRepository),
    new LogoutUseCase(sessionManager),
    new GetCurrentSessionUseCase(sessionManager)
  );
}
