import type { IHttpClient } from "@/application/ports/IHttpClient";
import { AxiosHttpClientAdapter } from "@/infrastructure/http/AxiosHttpClientAdapter";
import { HttpAuthRepository } from "@/infrastructure/repositories/HttpAuthRepository";
import { RefreshSessionUseCase } from "@/application/auth/RefreshSessionUseCase";
import { notifySessionInvalidated } from "@/framework/auth/sessionInvalidation";
import { createSessionManager, getCurrentSession } from "./session";
import { API_BASE_URL } from "./env";

/**
 * Composition (framework layer): builds the app HTTP client pointed at the
 * configured backend (`API_BASE_URL`). On a 401 for an authed request it first
 * tries to refresh the access token and retry once; if refresh fails it notifies
 * the session-invalidation channel so the AuthGate clears the session and
 * redirects to login. Returned as the `IHttpClient` port so application/
 * presentation never see the concrete Axios adapter.
 */
export function createHttpClient(): IHttpClient {
  return new AxiosHttpClientAdapter(API_BASE_URL, getCurrentAccessToken, notifySessionInvalidated, createRefreshRunner());
}

export function createBareHttpClient(): IHttpClient {
  return new AxiosHttpClientAdapter(API_BASE_URL);
}

/**
 * Builds the refresh callback over a BARE http client (no interceptors) so the
 * `POST /auth/refresh` call cannot recurse into the 401 refresh-retry logic.
 */
function createRefreshRunner(): () => Promise<string | null> {
  const bareClient = createBareHttpClient();
  const refreshSession = new RefreshSessionUseCase(new HttpAuthRepository(bareClient), createSessionManager());
  return () => refreshSession.execute();
}

async function getCurrentAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.accessToken ?? null;
}
