/**
 * Mobile environment configuration (framework layer).
 *
 * Resolves the backend base URL from `EXPO_PUBLIC_API_BASE_URL` (Expo inlines
 * `EXPO_PUBLIC_*` at build time). Falls back to the local backend so the app
 * works out of the box in development. Switch environments by setting
 * `EXPO_PUBLIC_API_BASE_URL` in `.env` (local/dev) or the build profile
 * (production/demo) — see the README "Environment variables" section.
 */
export const DEFAULT_API_BASE_URL = "http://localhost:3000";

export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return configured !== undefined && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
}

/** Backend base URL used by all HTTP adapters. */
export const API_BASE_URL = resolveApiBaseUrl();
