export type ThemeId = 'swiss' | 'grid' | 'aqua' | 'retro' | 'minimal' | 'neon';

export type CounterMode = 'countdown' | 'countup';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ProgressVisual = 'bar' | 'ring' | 'empty';

export type AppearanceMode = 'system' | 'light' | 'dark';

export type AppTab = 'dashboard' | 'library' | 'timeline' | 'settings';

export interface NotificationSettings {
  weekBefore: boolean;
  dayBefore: boolean;
  atEnd: boolean;
  repeatingMilestones: boolean;
}

export interface CountdownItem {
  id: string;
  title: string;
  icon: string;
  notes: string;
  mode: CounterMode;
  startDate: string;
  targetDate: string;
  recurrence: Recurrence;
  themeId: ThemeId;
  progressVisual: ProgressVisual;
  accentColor?: string;
  pinned: boolean;
  archived: boolean;
  folderId: string;
  trashedAt: string | null;
  previousFolderId: string | null;
  createdAt: string;
  updatedAt: string;
  notifications: NotificationSettings;
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  appearance: AppearanceMode;
  weekStartsOnMonday: boolean;
  haptics: boolean;
  showArchivedByDefault: boolean;
}

export interface AppState {
  schemaVersion: number;
  onboardingCompleted: boolean;
  proUnlocked: boolean;
  settings: AppSettings;
  folders: ProjectFolder[];
  countdowns: CountdownItem[];
}

export interface CountdownMetrics {
  windowStart: Date;
  windowEnd: Date;
  totalMs: number;
  elapsedMs: number;
  remainingMs: number;
  progress: number;
  isPastTarget: boolean;
  isRecurringWindow: boolean;
  displayDurationMs: number;
  primaryLabel: string;
  secondaryLabel: string;
  percentageLabel: string;
}

export interface ThemeTemplate {
  id: ThemeId;
  name: string;
  isPro: boolean;
  description: string;
  colors: {
    appBackground: string[];
    cardBackground: string[];
    accent: string;
    textPrimary: string;
    textSecondary: string;
    track: string;
    positive: string;
    warning: string;
  };
  borderRadius: number;
}

export interface CountdownPreset {
  id: string;
  title: string;
  icon: string;
  description: string;
  mode: CounterMode;
  defaultDurationDays: number;
  recurrence: Recurrence;
  themeId: ThemeId;
  progressVisual: ProgressVisual;
  notes: string;
}
