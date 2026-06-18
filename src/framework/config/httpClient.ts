import type { IHttpClient } from "@/application/ports/IHttpClient";
import { AxiosHttpClientAdapter } from "@/infrastructure/http/AxiosHttpClientAdapter";
import { API_BASE_URL } from "./env";

/**
 * Composition (framework layer): builds the app HTTP client pointed at the
 * configured backend (`API_BASE_URL`). Returned as the `IHttpClient` port so
 * application/presentation never see the concrete Axios adapter.
 */
export function createHttpClient(): IHttpClient {
  return new AxiosHttpClientAdapter(API_BASE_URL);
}
