import { GetCurrentSessionUseCase } from "@/application/auth/GetCurrentSessionUseCase";
import { LoginUseCase } from "@/application/auth/LoginUseCase";
import { LogoutUseCase } from "@/application/auth/LogoutUseCase";
import { RegisterUseCase } from "@/application/auth/RegisterUseCase";
import { HttpAuthRepository } from "@/infrastructure/repositories/HttpAuthRepository";
import { AuthViewModel } from "@/presentation/view-models/AuthViewModel";
import { createBareHttpClient } from "./httpClient";
import { createSessionManager } from "./session";

/**
 * Composition root (framework) for the auth flow: wires the HTTP auth repository
 * and the persistent `SessionManager` into the auth use cases and the
 * `AuthViewModel` the login route renders.
 */
export function createAuthViewModel(): AuthViewModel {
  const authRepository = new HttpAuthRepository(createBareHttpClient());
  const sessionManager = createSessionManager();
  return new AuthViewModel(
    new LoginUseCase(authRepository, sessionManager),
    new RegisterUseCase(authRepository),
    new LogoutUseCase(sessionManager, authRepository),
    new GetCurrentSessionUseCase(sessionManager)
  );
}
