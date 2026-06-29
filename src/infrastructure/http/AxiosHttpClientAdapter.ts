// Pattern: Adapter
import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig, isAxiosError } from 'axios';
import type { IHttpClient, HttpRequestConfig, HttpResponse } from '@/application/ports/IHttpClient';
import { HttpError } from './HttpError';

/** Supplies the current access token (or null) for the auth request interceptor. */
export type AuthTokenProvider = () => Promise<string | null>;

export class AxiosHttpClientAdapter implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string, tokenProvider?: AuthTokenProvider) {
    this.client = axios.create({ baseURL });
    if (tokenProvider !== undefined) {
      // Attach the session Bearer token to every request so repositories and
      // screens never hand-roll the Authorization header.
      this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        const token = await tokenProvider();
        if (token !== null && token !== '' && config.headers['Authorization'] === undefined) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      });
    }
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
