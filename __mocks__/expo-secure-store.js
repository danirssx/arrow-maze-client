/* global jest */
/**
 * Manual mock for `expo-secure-store`.
 *
 * `expo-secure-store` is a native module (iOS keychain / Android keystore) that
 * cannot run under Jest. This in-memory implementation backs the three async
 * keychain calls used by `SecureStorageAdapter` so tests assert observable
 * contract behavior (read/write/delete) rather than real keychain side effects.
 *
 * The functions are `jest.fn()` wrappers so tests can override behavior
 * (e.g. `getItemAsync.mockRejectedValueOnce(...)`); `__resetStore()` clears both
 * the backing map and the call history between tests.
 */
const store = new Map();

const getItemAsync = jest.fn(async (key) => (store.has(key) ? store.get(key) : null));
const setItemAsync = jest.fn(async (key, value) => {
  store.set(key, value);
});
const deleteItemAsync = jest.fn(async (key) => {
  store.delete(key);
});
const isAvailableAsync = jest.fn(async () => true);

function __resetStore() {
  store.clear();
  getItemAsync.mockClear();
  setItemAsync.mockClear();
  deleteItemAsync.mockClear();
  isAvailableAsync.mockClear();
}

module.exports = {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  isAvailableAsync,
  __resetStore,
};
