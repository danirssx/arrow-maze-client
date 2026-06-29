// Pattern: Adapter
import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, isAxiosError } from 'axios';
import type { IHttpClient, HttpRequestConfig, HttpResponse } from '@/application/ports/IHttpClient';
import { HttpError } from './HttpError';

/** Called when an authed request is rejected with 401, so the session can be invalidated. */
export type UnauthorizedHandler = () => void | Promise<void>;

export class AxiosHttpClientAdapter implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string, onUnauthorized?: UnauthorizedHandler) {
    this.client = axios.create({ baseURL });
    if (onUnauthorized !== undefined) {
      // On a 401 for a request that carried an Authorization header, signal that
      // the session must be invalidated, then re-reject so callers still receive
      // the mapped HttpError. Anonymous 401s (login, public GETs) are ignored.
      this.client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          if (error.response?.status === 401 && AxiosHttpClientAdapter.hadAuthorization(error.config)) {
            await onUnauthorized();
          }
          return Promise.reject(error);
        },
      );
    }
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
