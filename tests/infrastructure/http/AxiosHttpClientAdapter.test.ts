import axios from 'axios';
import { AxiosHttpClientAdapter } from '@/infrastructure/http/AxiosHttpClientAdapter';
import { HttpError } from '@/infrastructure/http/HttpError';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AxiosHttpClientAdapter', () => {
  let adapter: AxiosHttpClientAdapter;
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { response: { use: jest.fn() } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as never);
    adapter = new AxiosHttpClientAdapter('https://api.example.com');
  });

  describe('get', () => {
    it('should_return_response_when_request_succeeds', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 }, status: 200 });

      // Act
      const res = await adapter.get('/test');

      // Assert
      expect(res.data).toEqual({ id: 1 });
      expect(res.status).toBe(200);
    });

    it('should_throw_HttpError_UNAUTHORIZED_when_server_returns_401', async () => {
      // Arrange
      const axiosError = Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        response: { status: 401, data: {} },
      });
      mockAxiosInstance.get.mockRejectedValue(axiosError);
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // Act
      const act = () => adapter.get('/secure');

      // Assert
      await expect(act()).rejects.toBeInstanceOf(HttpError);
      await expect(act()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should_throw_HttpError_NOT_FOUND_when_server_returns_404', async () => {
      // Arrange
      const axiosError = Object.assign(new Error('Not found'), {
        isAxiosError: true,
        response: { status: 404, data: {} },
      });
      mockAxiosInstance.get.mockRejectedValue(axiosError);
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // Act & Assert
      await expect(adapter.get('/missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should_throw_HttpError_NETWORK_ERROR_when_no_response', async () => {
      // Arrange
      const axiosError = Object.assign(new Error('Network Error'), {
        isAxiosError: true,
        response: undefined,
      });
      mockAxiosInstance.get.mockRejectedValue(axiosError);
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // Act & Assert
      await expect(adapter.get('/test')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    });
  });

  describe('response interceptor (401 handling)', () => {
    type RejectHandler = (error: unknown) => Promise<never>;

    const authed401 = { response: { status: 401 }, config: { headers: { Authorization: 'Bearer x' } } };
    const anon401 = { response: { status: 401 }, config: { headers: {} } };
    const authed500 = { response: { status: 500 }, config: { headers: { Authorization: 'Bearer x' } } };

    function rejectHandlerFor(onUnauthorized: () => void): RejectHandler {
      new AxiosHttpClientAdapter('https://api.example.com', onUnauthorized);
      return mockAxiosInstance.interceptors.response.use.mock.calls[0][1] as RejectHandler;
    }

    it('should_call_onUnauthorized_and_rethrow_when_an_authed_request_returns_401', async () => {
      const onUnauthorized = jest.fn();
      const reject = rejectHandlerFor(onUnauthorized);

      await expect(reject(authed401)).rejects.toBe(authed401);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('should_not_call_onUnauthorized_when_the_request_had_no_authorization_header', async () => {
      const onUnauthorized = jest.fn();
      const reject = rejectHandlerFor(onUnauthorized);

      await expect(reject(anon401)).rejects.toBe(anon401);
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('should_not_call_onUnauthorized_on_a_non_401_error', async () => {
      const onUnauthorized = jest.fn();
      const reject = rejectHandlerFor(onUnauthorized);

      await expect(reject(authed500)).rejects.toBe(authed500);
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('should_call_onUnauthorized_when_a_lowercase_authorization_header_was_present', async () => {
      const onUnauthorized = jest.fn();
      const reject = rejectHandlerFor(onUnauthorized);
      const lowercase401 = { response: { status: 401 }, config: { headers: { authorization: 'Bearer x' } } };

      await expect(reject(lowercase401)).rejects.toBe(lowercase401);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('should_not_call_onUnauthorized_when_the_request_config_has_no_headers', async () => {
      const onUnauthorized = jest.fn();
      const reject = rejectHandlerFor(onUnauthorized);
      const noHeaders401 = { response: { status: 401 }, config: {} };

      await expect(reject(noHeaders401)).rejects.toBe(noHeaders401);
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('should_not_call_onUnauthorized_on_a_network_error_without_a_response', async () => {
      const onUnauthorized = jest.fn();
      const reject = rejectHandlerFor(onUnauthorized);
      const networkError = { config: { headers: { Authorization: 'Bearer x' } } };

      await expect(reject(networkError)).rejects.toBe(networkError);
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('should_pass_through_successful_responses_unchanged', () => {
      new AxiosHttpClientAdapter('https://api.example.com', jest.fn());
      const onFulfilled = mockAxiosInstance.interceptors.response.use.mock.calls[0][0] as (r: unknown) => unknown;
      const response = { data: 1, status: 200 };

      expect(onFulfilled(response)).toBe(response);
    });

    it('should_not_register_a_response_interceptor_when_no_handler_is_given', () => {
      new AxiosHttpClientAdapter('https://api.example.com');

      expect(mockAxiosInstance.interceptors.response.use).not.toHaveBeenCalled();
    });
  });

  describe('post', () => {
    it('should_return_201_when_resource_created', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValue({ data: { created: true }, status: 201 });

      // Act
      const res = await adapter.post('/items', { name: 'test' });

      // Assert
      expect(res.status).toBe(201);
      expect(res.data).toEqual({ created: true });
    });

    it('should_throw_HttpError_SERVER_ERROR_when_server_returns_500', async () => {
      // Arrange
      const axiosError = Object.assign(new Error('Internal Server Error'), {
        isAxiosError: true,
        response: { status: 500, data: {} },
      });
      mockAxiosInstance.post.mockRejectedValue(axiosError);
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // Act & Assert
      await expect(adapter.post('/items', {})).rejects.toMatchObject({ code: 'SERVER_ERROR' });
    });
  });
});
