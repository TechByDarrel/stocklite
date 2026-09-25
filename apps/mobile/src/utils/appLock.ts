import { AppState, type AppStateStatus } from 'react-native';

const GRACE_PERIOD_MS = 30000;
let backgroundedAt: number | null = null;
let listeners: ((shouldLock: boolean) => void)[] = [];

function notify(shouldLock: boolean) {
  listeners.forEach((listener) => listener(shouldLock));
}

export function onAppLockStateChange(listener: (shouldLock: boolean) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function startAppLockWatcher(): () => void {
  const handleChange = (nextState: AppStateStatus) => {
    if (nextState === 'background' || nextState === 'inactive') {
      backgroundedAt = Date.now();
    } else if (nextState === 'active') {
      if (backgroundedAt !== null) {
        const elapsed = Date.now() - backgroundedAt;
        backgroundedAt = null;
        if (elapsed >= GRACE_PERIOD_MS) {
          notify(true);
        }
      }
    }
  };

  const subscription = AppState.addEventListener('change', handleChange);
  return () => subscription.remove();
}