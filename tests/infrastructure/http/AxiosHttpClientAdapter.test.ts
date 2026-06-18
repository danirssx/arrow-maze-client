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
