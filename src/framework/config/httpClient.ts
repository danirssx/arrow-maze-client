import type { IHttpClient } from "@/application/ports/IHttpClient";
import { AxiosHttpClientAdapter } from "@/infrastructure/http/AxiosHttpClientAdapter";
import { notifySessionInvalidated } from "@/framework/auth/sessionInvalidation";
import { API_BASE_URL } from "./env";

/**
 * Composition (framework layer): builds the app HTTP client pointed at the
 * configured backend (`API_BASE_URL`). A 401 on an authed request notifies the
 * session-invalidation channel so the AuthGate clears the session and redirects
 * to login. Returned as the `IHttpClient` port so application/presentation never
 * see the concrete Axios adapter.
 */
export function createHttpClient(): IHttpClient {
  return new AxiosHttpClientAdapter(API_BASE_URL, notifySessionInvalidated);
}
