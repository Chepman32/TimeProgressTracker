import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildInitialState } from '../domain/factories';
import { AppState, CountdownItem, ProjectFolder } from '../domain/types';
import { LEGACY_DEFAULT_FOLDER_ID, UNASSIGNED_FOLDER_ID } from '../domain/folders';

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

function normalizeFolders(rawFolders: unknown, fallbackFolders: ProjectFolder[]): ProjectFolder[] {
  if (!Array.isArray(rawFolders)) {
    return fallbackFolders;
  }

  const normalized = rawFolders
    .map(folder => {
      if (!folder || typeof folder !== 'object') {
        return null;
      }

      const typed = folder as Partial<ProjectFolder>;
      const id = typeof typed.id === 'string' ? typed.id.trim() : '';
      const name = typeof typed.name === 'string' ? typed.name.trim() : '';

      if (!id || !name) {
        return null;
      }

      return {
        id,
        name,
        createdAt:
          typeof typed.createdAt === 'string' && typed.createdAt.length > 0
            ? typed.createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof typed.updatedAt === 'string' && typed.updatedAt.length > 0
            ? typed.updatedAt
            : new Date().toISOString(),
      };
    })
    .filter((folder): folder is ProjectFolder => Boolean(folder));

  const deduped = normalized.filter(
    (folder, index, all) => all.findIndex(item => item.id === folder.id) === index,
  );
  const withoutLegacyDefault = deduped.filter(
    folder => folder.id !== LEGACY_DEFAULT_FOLDER_ID,
  );

  return withoutLegacyDefault.length > 0 ? withoutLegacyDefault : fallbackFolders;
}

function normalizeCountdowns(
  rawCountdowns: unknown,
  folderIds: Set<string>,
  fallbackFolderId: string,
  fallbackCountdowns: CountdownItem[],
): CountdownItem[] {
  if (!Array.isArray(rawCountdowns)) {
    return fallbackCountdowns;
  }

  return rawCountdowns.map(countdown => {
    const typed = countdown as CountdownItem;
    const requestedFolderIdRaw =
      typeof typed.folderId === 'string' && typed.folderId.length > 0
        ? typed.folderId
        : fallbackFolderId;
    const requestedFolderId =
      requestedFolderIdRaw === LEGACY_DEFAULT_FOLDER_ID
        ? fallbackFolderId
        : requestedFolderIdRaw;
    const resolvedFolderId = folderIds.has(requestedFolderId)
      ? requestedFolderId
      : fallbackFolderId;
    const trashedAt =
      typeof typed.trashedAt === 'string' && typed.trashedAt.length > 0
        ? typed.trashedAt
        : null;
    const requestedPreviousFolderId =
      typeof typed.previousFolderId === 'string' && typed.previousFolderId.length > 0
        ? typed.previousFolderId === LEGACY_DEFAULT_FOLDER_ID
          ? fallbackFolderId
          : typed.previousFolderId
        : null;
    const previousFolderId =
      trashedAt && requestedPreviousFolderId && folderIds.has(requestedPreviousFolderId)
        ? requestedPreviousFolderId
        : trashedAt
          ? resolvedFolderId
          : null;

    return {
      ...typed,
      folderId: resolvedFolderId,
      trashedAt,
      previousFolderId,
    };
  });
}

function migrateAppState(rawState: unknown): AppState {
  if (!isValidAppState(rawState)) {
    return buildInitialState();
  }

  const next = rawState as Partial<AppState>;
  const fallback = buildInitialState();
  const folders = normalizeFolders(next.folders, fallback.folders);
  const folderIds = new Set(folders.map(folder => folder.id));
  const fallbackFolderId = folders[0]?.id ?? UNASSIGNED_FOLDER_ID;
  const countdowns = normalizeCountdowns(
    next.countdowns,
    folderIds,
    fallbackFolderId,
    fallback.countdowns,
  );

  return {
    ...fallback,
    ...next,
    schemaVersion: 3,
    proUnlocked: typeof next.proUnlocked === 'boolean' ? next.proUnlocked : false,
    folders,
    countdowns,
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
