import { HttpAuthRepository } from '@/infrastructure/repositories/HttpAuthRepository';
import type { IHttpClient, HttpResponse } from '@/application/ports/IHttpClient';
import type { LoginResponseDto, RegisterResponseDto } from '@/infrastructure/mappers/auth/AuthDtos';

class FakeHttpClient implements IHttpClient {
  postResponse: unknown = null;
  async get<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async post<T>(): Promise<HttpResponse<T>> { return { data: this.postResponse as T, status: 201 }; }
  async put<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async delete<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
}

const LOGIN_RESPONSE: LoginResponseDto = {
  status: 'success',
  data: { accessToken: 'token-placeholder', userId: 'user-uuid-1', username: 'player', role: 'USER' },
};

const REGISTER_RESPONSE: RegisterResponseDto = {
  status: 'success',
  data: { userId: 'user-uuid-1' },
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
      // Arrange
      http.postResponse = LOGIN_RESPONSE;

      // Act
      const session = await repo.login({ email: 'player@example.com', rawPassword: 'pass' });

      // Assert
      expect(session.userId).toBe('user-uuid-1');
      expect(session.username).toBe('player');
      expect(session.role).toBe('USER');
    });

    it('should_map_accessToken_to_session', async () => {
      // Arrange
      http.postResponse = LOGIN_RESPONSE;

      // Act
      const session = await repo.login({ email: 'player@example.com', rawPassword: 'pass' });

      // Assert
      expect(session.accessToken).toBeDefined();
      expect(typeof session.accessToken).toBe('string');
    });
  });

  describe('register', () => {
    it('should_return_userId_when_registration_succeeds', async () => {
      // Arrange
      http.postResponse = REGISTER_RESPONSE;

      // Act
      const output = await repo.register({ email: 'player@example.com', username: 'player', rawPassword: 'pass' });

      // Assert
      expect(output.userId).toBe('user-uuid-1');
    });
  });
});
