export interface HttpRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
}

export interface IHttpClient {
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  post<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  put<T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
}
