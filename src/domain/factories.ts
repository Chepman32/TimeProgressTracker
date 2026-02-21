import { addDays, subDays } from 'date-fns';
import { COUNTDOWN_PRESETS } from './presets';
import {
  AppSettings,
  AppState,
  CountdownItem,
  CountdownPreset,
  NotificationSettings,
  ThemeId,
} from './types';
import { createId } from '../lib/id';
import { UNASSIGNED_FOLDER_ID } from './folders';

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  weekBefore: true,
  dayBefore: true,
  atEnd: true,
  repeatingMilestones: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  appearance: 'system',
  haptics: true,
  showArchivedByDefault: false,
  weekStartsOnMonday: true,
};

const now = new Date();

function toIso(date: Date): string {
  return date.toISOString();
}

export function createCountdownFromPreset(
  preset: CountdownPreset,
  nowDate = new Date(),
  folderId = UNASSIGNED_FOLDER_ID,
): CountdownItem {
  const targetDate = addDays(nowDate, preset.defaultDurationDays);
  const startDate = preset.mode === 'countup' ? subDays(nowDate, 30) : nowDate;

  return {
    id: createId('countdown'),
    title: preset.title,
    icon: preset.icon,
    notes: preset.notes,
    mode: preset.mode,
    startDate: toIso(startDate),
    targetDate: toIso(targetDate),
    recurrence: preset.recurrence,
    themeId: preset.themeId,
    progressVisual: preset.progressVisual,
    pinned: false,
    archived: false,
    folderId,
    trashedAt: null,
    previousFolderId: null,
    createdAt: toIso(nowDate),
    updatedAt: toIso(nowDate),
    notifications: { ...DEFAULT_NOTIFICATIONS },
  };
}

export function createBlankCountdown(
  themeId: ThemeId = 'swiss',
  folderId = UNASSIGNED_FOLDER_ID,
): CountdownItem {
  const startDate = new Date();
  const targetDate = addDays(startDate, 30);

  return {
    id: createId('countdown'),
    title: 'New countdown',
    icon: '⏳',
    notes: '',
    mode: 'countdown',
    startDate: toIso(startDate),
    targetDate: toIso(targetDate),
    recurrence: 'none',
    themeId,
    progressVisual: 'bar',
    pinned: false,
    archived: false,
    folderId,
    trashedAt: null,
    previousFolderId: null,
    createdAt: toIso(startDate),
    updatedAt: toIso(startDate),
    notifications: { ...DEFAULT_NOTIFICATIONS },
  };
}

export function buildInitialCountdowns(): CountdownItem[] {
  return [
    createCountdownFromPreset(COUNTDOWN_PRESETS[0], now),
    createCountdownFromPreset(COUNTDOWN_PRESETS[1], now),
    createCountdownFromPreset(COUNTDOWN_PRESETS[6], now),
    createCountdownFromPreset(COUNTDOWN_PRESETS[5], now),
  ].map((item, index) => ({
    ...item,
    pinned: index === 0,
  }));
}

export function buildInitialState(): AppState {
  return {
    schemaVersion: 3,
    onboardingCompleted: false,
    proUnlocked: false,
    settings: { ...DEFAULT_SETTINGS },
    folders: [],
    countdowns: buildInitialCountdowns(),
  };
}
