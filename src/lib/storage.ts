import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildInitialState } from '../domain/factories';
import { AppState } from '../domain/types';

const STORAGE_KEY = '@time-progress-tracker/state-v1';

export async function loadAppState(): Promise<AppState> {
  try {
    const rawState = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return buildInitialState();
    }

    const parsed = JSON.parse(rawState) as AppState;
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.countdowns)) {
      return buildInitialState();
    }

    return parsed;
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
