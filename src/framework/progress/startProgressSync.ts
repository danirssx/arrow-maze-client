type Unsubscribe = () => void;
type DrainPendingProgress = () => Promise<boolean>;
type ProgressSyncTriggers = {
  readonly subscribeForeground: (listener: () => void) => Unsubscribe;
  readonly subscribeReconnect: (listener: () => void) => Unsubscribe;
};

export function startProgressSync(
  drain: DrainPendingProgress,
  triggers: ProgressSyncTriggers,
): Unsubscribe {
  const runDrain = () => {
    void drain();
  };

  runDrain();
  const unsubscribeForeground = triggers.subscribeForeground(runDrain);
  const unsubscribeReconnect = triggers.subscribeReconnect(runDrain);

  return () => {
    unsubscribeForeground();
    unsubscribeReconnect();
  };
}
