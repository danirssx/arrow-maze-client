import { startProgressSync } from "@/framework/progress/startProgressSync";

describe("startProgressSync", () => {
  it("should_drain_once_immediately_when_started", () => {
    const drain = jest.fn<Promise<boolean>, []>().mockResolvedValue(false);

    startProgressSync(drain, {
      subscribeForeground: jest.fn(() => jest.fn()),
      subscribeReconnect: jest.fn(() => jest.fn()),
    });

    expect(drain).toHaveBeenCalledTimes(1);
  });

  it("should_drain_on_foreground_and_reconnect_until_unsubscribed", () => {
    const drain = jest.fn<Promise<boolean>, []>().mockResolvedValue(false);
    let foreground: (() => void) | undefined;
    let reconnect: (() => void) | undefined;

    const unsubscribe = startProgressSync(drain, {
      subscribeForeground: (listener) => {
        foreground = listener;
        return () => {
          foreground = undefined;
        };
      },
      subscribeReconnect: (listener) => {
        reconnect = listener;
        return () => {
          reconnect = undefined;
        };
      },
    });

    foreground?.();
    expect(drain).toHaveBeenCalledTimes(2);

    reconnect?.();
    expect(drain).toHaveBeenCalledTimes(3);

    unsubscribe();
    foreground?.();
    reconnect?.();
    expect(drain).toHaveBeenCalledTimes(3);
  });
});
