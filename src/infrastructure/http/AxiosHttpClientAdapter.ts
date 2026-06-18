// Pattern: Adapter
import axios, { type AxiosInstance, type AxiosRequestConfig, isAxiosError } from 'axios';
import type { IHttpClient, HttpRequestConfig, HttpResponse } from '@/application/ports/IHttpClient';
import { HttpError } from './HttpError';

export class AxiosHttpClientAdapter implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string, defaultHeaders?: Record<string, string>) {
    const createConfig: AxiosRequestConfig = { baseURL };
    if (defaultHeaders !== undefined) createConfig.headers = defaultHeaders;
    this.client = axios.create(createConfig);
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
