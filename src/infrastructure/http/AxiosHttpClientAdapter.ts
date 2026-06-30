// Pattern: Adapter
import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig, isAxiosError } from 'axios';
import type { IHttpClient, HttpRequestConfig, HttpResponse } from '@/application/ports/IHttpClient';
import { HttpError } from './HttpError';

/** Called when an authed request is rejected with 401, so the session can be invalidated. */
export type UnauthorizedHandler = () => void | Promise<void>;
/** Attempts to refresh the access token; resolves to the new token, or null if refresh is not possible. */
export type RefreshHandler = () => Promise<string | null>;
/** Supplies the current access token (or null) for the auth request interceptor. */
export type AuthTokenProvider = () => Promise<string | null>;

// Marks a request that was already retried after a refresh, so a second 401 does
// not trigger another refresh (avoids an infinite refresh/retry loop).
const RETRY_FLAG = '_arrowMazeRefreshRetried';

export class AxiosHttpClientAdapter implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(
    baseURL: string,
    tokenProvider?: AuthTokenProvider,
    onUnauthorized?: UnauthorizedHandler,
    tryRefresh?: RefreshHandler,
  ) {
    this.client = axios.create({ baseURL });
    if (tokenProvider !== undefined) {
      this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        const token = await tokenProvider();
        if (
          token !== null &&
          token !== '' &&
          config.headers['Authorization'] === undefined &&
          config.headers['authorization'] === undefined
        ) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      });
    }

    if (onUnauthorized !== undefined || tryRefresh !== undefined) {
      // On a 401 for a request that carried an Authorization header: try to
      // refresh the access token and retry the request once with the new token;
      // if refresh is unavailable/fails, invalidate the session and re-reject so
      // callers still receive the mapped HttpError. Anonymous 401s are ignored.
      this.client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          if (error.response?.status === 401 && AxiosHttpClientAdapter.hadAuthorization(error.config)) {
            if (tryRefresh !== undefined && error.config !== undefined && !AxiosHttpClientAdapter.isRetried(error.config)) {
              const newToken = await tryRefresh();
              if (newToken !== null && newToken !== '') {
                return this.retryWithToken(error.config, newToken);
              }
            }
            if (onUnauthorized !== undefined) await onUnauthorized();
          }
          return Promise.reject(error);
        },
      );
    }
  }

  private retryWithToken(config: NonNullable<AxiosError['config']>, token: string): Promise<unknown> {
    const headers = { ...(config.headers as Record<string, unknown> | undefined), Authorization: `Bearer ${token}` };
    const retryConfig: Record<string, unknown> = { ...config, headers, [RETRY_FLAG]: true };
    return this.client.request(retryConfig as never);
  }

  private static isRetried(config: NonNullable<AxiosError['config']>): boolean {
    return (config as unknown as Record<string, unknown>)[RETRY_FLAG] === true;
  }

  private static hadAuthorization(config: AxiosError['config']): boolean {
    const headers = config?.headers as Record<string, unknown> | undefined;
    if (headers === undefined) return false;
    return headers['Authorization'] !== undefined || headers['authorization'] !== undefined;
  }

  async get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      const res = await this.client.get(url, this.toAxiosConfig(config));
      return { data: res.data as T, status: res.status };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async post<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      const res = await this.client.post(url, body, this.toAxiosConfig(config));
      return { data: res.data as T, status: res.status };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async put<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      const res = await this.client.put(url, body, this.toAxiosConfig(config));
      return { data: res.data as T, status: res.status };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      const res = await this.client.delete(url, this.toAxiosConfig(config));
      return { data: res.data as T, status: res.status };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private toAxiosConfig(config?: HttpRequestConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {};
    if (config?.headers !== undefined) axiosConfig.headers = config.headers;
    if (config?.params !== undefined) axiosConfig.params = config.params;
    return axiosConfig;
  }

  private mapError(err: unknown): HttpError {
    if (isAxiosError(err)) {
      if (err.response !== undefined) {
        return HttpError.fromStatusCode(err.response.status, err.message);
      }
      return new HttpError('NETWORK_ERROR', err.message);
    }
    return new HttpError('UNKNOWN', err instanceof Error ? err.message : 'Unknown error');
  }
}
