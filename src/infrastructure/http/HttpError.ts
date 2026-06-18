export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'UNPROCESSABLE'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class HttpError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static fromStatusCode(statusCode: number, message: string): HttpError {
    const code = HttpError.mapStatusToCode(statusCode);
    return new HttpError(code, message, statusCode);
  }

  private static mapStatusToCode(status: number): AppErrorCode {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    if (status === 422) return 'UNPROCESSABLE';
    if (status >= 500) return 'SERVER_ERROR';
    return 'UNKNOWN';
  }
}
