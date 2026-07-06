import { HttpAuthRepository } from '@/infrastructure/repositories/HttpAuthRepository';
import type { IHttpClient, HttpResponse } from '@/application/ports/IHttpClient';
import type { LoginResponseDto, RefreshResponseDto, RegisterResponseDto } from '@/infrastructure/mappers/auth/AuthDtos';

class FakeHttpClient implements IHttpClient {
  postResponse: unknown = null;
  lastPostUrl: string | null = null;
  lastPostBody: unknown = null;
  async get<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async post<T>(url: string, body?: unknown): Promise<HttpResponse<T>> {
    this.lastPostUrl = url;
    this.lastPostBody = body;
    return { data: this.postResponse as T, status: 201 };
  }
  async put<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async delete<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
}

const LOGIN_RESPONSE: LoginResponseDto = {
  status: 'success',
  data: { accessToken: 'token-placeholder', refreshToken: 'refresh-placeholder', userId: 'user-uuid-1', username: 'player', role: 'USER' },
};

const REGISTER_RESPONSE: RegisterResponseDto = {
  status: 'success',
  data: { userId: 'user-uuid-1' },
};

const REFRESH_RESPONSE: RefreshResponseDto = {
  status: 'success',
  data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
};

describe('HttpAuthRepository', () => {
  let http: FakeHttpClient;
  let repo: HttpAuthRepository;

  beforeEach(() => {
    http = new FakeHttpClient();
    repo = new HttpAuthRepository(http);
  });

  describe('login', () => {
    it('should_return_session_when_credentials_are_valid', async () => {
      http.postResponse = LOGIN_RESPONSE;
      const session = await repo.login({ email: 'player@example.com', rawPassword: 'pass' });
      expect(session.userId).toBe('user-uuid-1');
      expect(session.username).toBe('player');
      expect(session.role).toBe('USER');
    });

    it('should_map_access_and_refresh_tokens_to_session', async () => {
      http.postResponse = LOGIN_RESPONSE;
      const session = await repo.login({ email: 'player@example.com', rawPassword: 'pass' });
      expect(session.accessToken).toBe('token-placeholder');
      expect(session.refreshToken).toBe('refresh-placeholder');
    });
  });

  describe('register', () => {
    it('should_return_userId_when_registration_succeeds', async () => {
      http.postResponse = REGISTER_RESPONSE;
      const output = await repo.register({ email: 'player@example.com', username: 'player', rawPassword: 'pass' });
      expect(output.userId).toBe('user-uuid-1');
    });
  });

  describe('refresh', () => {
    it('should_post_the_refresh_token_and_return_the_rotated_tokens', async () => {
      http.postResponse = REFRESH_RESPONSE;
      const tokens = await repo.refresh('old-refresh');
      expect(http.lastPostUrl).toBe('/auth/refresh');
      expect(http.lastPostBody).toEqual({ refreshToken: 'old-refresh' });
      expect(tokens).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    });
  });

  describe('logout', () => {
    it('should_post_the_refresh_token_to_revoke_it', async () => {
      await repo.logout('a-refresh');
      expect(http.lastPostUrl).toBe('/auth/logout');
      expect(http.lastPostBody).toEqual({ refreshToken: 'a-refresh' });
    });
  });
});
