import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { buildInitialState, createCountdownFromPreset } from '../domain/factories';
import { CountdownPreset, AppState, CountdownItem, AppSettings } from '../domain/types';
import { loadAppState, resetAppState, saveAppState } from '../lib/storage';

type Action =
  | { type: 'hydrate'; payload: AppState }
  | { type: 'complete_onboarding' }
  | { type: 'set_pro_unlocked'; payload: { value: boolean } }
  | { type: 'create'; payload: CountdownItem }
  | { type: 'update'; payload: CountdownItem }
  | { type: 'remove'; payload: { id: string } }
  | { type: 'toggle_archive'; payload: { id: string } }
  | { type: 'toggle_pin'; payload: { id: string } }
  | { type: 'update_settings'; payload: Partial<AppSettings> }
  | { type: 'replace_all'; payload: AppState };

function countdownReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    case 'complete_onboarding':
      return {
        ...state,
        onboardingCompleted: true,
      };
    case 'set_pro_unlocked':
      return {
        ...state,
        proUnlocked: action.payload.value,
      };
    case 'create':
      return {
        ...state,
        countdowns: [action.payload, ...state.countdowns],
      };
    case 'update':
      return {
        ...state,
        countdowns: state.countdowns.map(item =>
          item.id === action.payload.id ? action.payload : item,
        ),
      };
    case 'remove':
      return {
        ...state,
        countdowns: state.countdowns.filter(item => item.id !== action.payload.id),
      };
    case 'toggle_archive':
      return {
        ...state,
        countdowns: state.countdowns.map(item => {
          if (item.id !== action.payload.id) {
            return item;
          }

          return {
            ...item,
            archived: !item.archived,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'toggle_pin':
      return {
        ...state,
        countdowns: state.countdowns.map(item => {
          if (item.id !== action.payload.id) {
            return item;
          }

          return {
            ...item,
            pinned: !item.pinned,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'update_settings':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    case 'replace_all':
      return action.payload;
    default:
      return state;
  }
}

export interface CountdownStore {
  isReady: boolean;
  state: AppState;
  actions: {
    completeOnboarding: () => void;
    setProUnlocked: (value: boolean) => void;
    addCountdown: (item: CountdownItem) => void;
    updateCountdown: (item: CountdownItem) => void;
    addFromPreset: (preset: CountdownPreset) => CountdownItem;
    removeCountdown: (id: string) => void;
    toggleArchive: (id: string) => void;
    togglePin: (id: string) => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    resetState: () => Promise<void>;
    importState: (state: AppState) => void;
  };
}

export function useCountdownStore(): CountdownStore {
  const [state, dispatch] = useReducer(countdownReducer, undefined, buildInitialState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const persistedState = await loadAppState();
      if (!mounted) {
        return;
      }

      dispatch({ type: 'hydrate', payload: persistedState });
      setIsReady(true);
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    saveAppState(state);
  }, [isReady, state]);

  const actions = useMemo(
    () => ({
      completeOnboarding: () => dispatch({ type: 'complete_onboarding' }),
      setProUnlocked: (value: boolean) =>
        dispatch({ type: 'set_pro_unlocked', payload: { value } }),
      addCountdown: (item: CountdownItem) => dispatch({ type: 'create', payload: item }),
      updateCountdown: (item: CountdownItem) => dispatch({ type: 'update', payload: item }),
      addFromPreset: (preset: CountdownPreset) => {
        const item = createCountdownFromPreset(preset);
        dispatch({ type: 'create', payload: item });
        return item;
      },
      removeCountdown: (id: string) => dispatch({ type: 'remove', payload: { id } }),
      toggleArchive: (id: string) => dispatch({ type: 'toggle_archive', payload: { id } }),
      togglePin: (id: string) => dispatch({ type: 'toggle_pin', payload: { id } }),
      updateSettings: (settings: Partial<AppSettings>) =>
        dispatch({ type: 'update_settings', payload: settings }),
      resetState: async () => {
        const freshState = await resetAppState();
        dispatch({ type: 'replace_all', payload: freshState });
      },
      importState: (nextState: AppState) =>
        dispatch({ type: 'replace_all', payload: nextState }),
    }),
    [],
  );

  return {
    isReady,
    state,
    actions,
  };
}

export function useSortedCountdowns(countdowns: CountdownItem[]): CountdownItem[] {
  return useMemo(() => {
    return [...countdowns].sort((first, second) => {
      if (first.pinned !== second.pinned) {
        return first.pinned ? -1 : 1;
      }

      if (first.archived !== second.archived) {
        return first.archived ? 1 : -1;
      }

      return new Date(first.targetDate).getTime() - new Date(second.targetDate).getTime();
    });
  }, [countdowns]);
}

export function useCountdownById(
  countdowns: CountdownItem[],
  id: string | null,
): CountdownItem | undefined {
  return useMemo(() => {
    if (!id) {
      return undefined;
    }

    return countdowns.find(item => item.id === id);
  }, [countdowns, id]);
}

export function useDebouncedNow(updateEveryMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), updateEveryMs);

    return () => {
      clearInterval(interval);
    };
  }, [updateEveryMs]);

  return now;
}

export function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T,
): T {
  return useCallback(callback, [callback]) as T;
}
