/* global jest */
const listeners = new Set();

const NetInfo = {
  addEventListener: jest.fn((listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  __emit(state) {
    listeners.forEach((listener) => listener(state));
  },
  __reset() {
    listeners.clear();
    NetInfo.addEventListener.mockClear();
    NetInfo.fetch.mockClear();
  },
};

module.exports = NetInfo;
module.exports.default = NetInfo;
