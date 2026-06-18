/**
 * Contract tests: validate that client DTOs match the backend OpenAPI shapes.
 * Source of truth: arrow-maze-backend openApiSpec (LoginResponse, RegisterResponse).
 * No real network calls — uses static fixtures derived from OpenAPI examples.
 * DoD: no secrets in fixtures (accessToken uses placeholder string).
 */
import { AuthMapper } from '@/infrastructure/mappers/auth/AuthMapper';
import type { LoginResponseDto, RegisterResponseDto } from '@/infrastructure/mappers/auth/AuthDtos';

const LOGIN_FIXTURE: LoginResponseDto = {
  status: 'success',
  data: {
    accessToken: 'contract-test-token-placeholder',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    username: 'arrow_player',
    role: 'USER',
  },
};

const REGISTER_FIXTURE: RegisterResponseDto = {
  status: 'success',
  data: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
  },
};

describe('Auth contract — LoginResponseDto', () => {
  it('should_have_status_success_field', () => {
    expect(LOGIN_FIXTURE.status).toBe('success');
  });

  it('should_have_accessToken_userId_username_role_in_data', () => {
    const { data } = LOGIN_FIXTURE;
    expect(typeof data.accessToken).toBe('string');
    expect(typeof data.userId).toBe('string');
    expect(typeof data.username).toBe('string');
    expect(['USER', 'ADMIN']).toContain(data.role);
  });

  it('should_map_to_AuthSession_with_all_required_fields', () => {
    const session = AuthMapper.toSession(LOGIN_FIXTURE);
    expect(session.userId).toBe(LOGIN_FIXTURE.data.userId);
    expect(session.username).toBe(LOGIN_FIXTURE.data.username);
    expect(session.role).toBe(LOGIN_FIXTURE.data.role);
    expect(session.accessToken).toBe(LOGIN_FIXTURE.data.accessToken);
  });

  it('should_not_expose_raw_password_in_session', () => {
    const session = AuthMapper.toSession(LOGIN_FIXTURE);
    expect(Object.keys(session)).not.toContain('rawPassword');
    expect(Object.keys(session)).not.toContain('password');
  });
});

describe('Auth contract — RegisterResponseDto', () => {
  it('should_have_status_success_and_userId', () => {
    expect(REGISTER_FIXTURE.status).toBe('success');
    expect(typeof REGISTER_FIXTURE.data.userId).toBe('string');
  });

  it('should_map_to_RegisterOutput_with_userId', () => {
    const output = AuthMapper.toRegisterOutput(REGISTER_FIXTURE);
    expect(output.userId).toBe(REGISTER_FIXTURE.data.userId);
  });
});
