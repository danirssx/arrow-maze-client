import type { IHttpClient } from "@/application/ports/IHttpClient";
import { AxiosHttpClientAdapter } from "@/infrastructure/http/AxiosHttpClientAdapter";
import { getCurrentSession } from "./session";
import { API_BASE_URL } from "./env";

/**
 * Composition (framework layer): builds the app HTTP client pointed at the
 * configured backend (`API_BASE_URL`). The injected token provider reads the
 * current session so a request interceptor attaches `Authorization: Bearer`
 * automatically — repositories/screens never hand-roll the header. Returned as
 * the `IHttpClient` port so application/presentation never see Axios.
 */
export function createHttpClient(): IHttpClient {
  return new AxiosHttpClientAdapter(API_BASE_URL, async () => {
    const session = await getCurrentSession();
    return session?.accessToken ?? null;
  });
}
