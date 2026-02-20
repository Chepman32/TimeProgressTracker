import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildInitialState } from '../domain/factories';
import { AppState } from '../domain/types';

const STORAGE_KEY = '@time-progress-tracker/state-v1';

function isValidAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const typed = value as Partial<AppState>;
  if (!Array.isArray(typed.countdowns) || !typed.settings || typeof typed.settings !== 'object') {
    return false;
  }

  return true;
}

function migrateAppState(rawState: unknown): AppState {
  if (!isValidAppState(rawState)) {
    return buildInitialState();
  }

  const next = rawState as Partial<AppState>;
  const fallback = buildInitialState();

  return {
    ...fallback,
    ...next,
    schemaVersion: 2,
    proUnlocked: typeof next.proUnlocked === 'boolean' ? next.proUnlocked : false,
    countdowns: Array.isArray(next.countdowns) ? next.countdowns : fallback.countdowns,
    settings: {
      ...fallback.settings,
      ...(next.settings ?? {}),
    },
  };
}

export async function loadAppState(): Promise<AppState> {
  try {
    const rawState = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return buildInitialState();
    }

    const parsed = JSON.parse(rawState) as unknown;
    return migrateAppState(parsed);
  } catch {
    return buildInitialState();
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence failures to keep the app interactive.
  }
}

export async function resetAppState(): Promise<AppState> {
  const initial = buildInitialState();
  await saveAppState(initial);
  return initial;
}

export function parseImportedState(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidAppState(parsed)) {
      return null;
    }

    return migrateAppState(parsed);
  } catch {
    return null;
  }
}
