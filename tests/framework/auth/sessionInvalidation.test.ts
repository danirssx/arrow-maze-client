import { onSessionInvalidated, notifySessionInvalidated } from "@/framework/auth/sessionInvalidation";

describe("sessionInvalidation", () => {
  it("should_call_subscribed_listener_when_notified", () => {
    const listener = jest.fn();
    const unsubscribe = onSessionInvalidated(listener);

    notifySessionInvalidated();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("should_stop_calling_listener_after_unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = onSessionInvalidated(listener);
    unsubscribe();

    notifySessionInvalidated();

    expect(listener).not.toHaveBeenCalled();
  });

  it("should_notify_all_subscribers", () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubFirst = onSessionInvalidated(first);
    const unsubSecond = onSessionInvalidated(second);

    notifySessionInvalidated();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    unsubFirst();
    unsubSecond();
  });

  it("should_not_throw_when_notifying_with_no_subscribers", () => {
    expect(() => notifySessionInvalidated()).not.toThrow();
  });
});
