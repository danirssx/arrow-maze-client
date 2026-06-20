import { DEFAULT_API_BASE_URL, resolveApiBaseUrl } from "@/framework/config/env";

describe("API environment config", () => {
  const original = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = original;
    }
  });

  it("should_default_to_local_backend_when_unset", () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    expect(resolveApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(DEFAULT_API_BASE_URL).toBe("http://localhost:3000");
  });

  it("should_use_the_configured_url_when_set", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com";

    expect(resolveApiBaseUrl()).toBe("https://api.example.com");
  });

  it("should_fall_back_when_the_value_is_blank", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "   ";

    expect(resolveApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });
});
