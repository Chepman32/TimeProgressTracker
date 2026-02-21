import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { buildInitialState, createCountdownFromPreset } from '../domain/factories';
import { DEFAULT_FOLDER_ID } from '../domain/folders';
import {
  CountdownPreset,
  AppState,
  CountdownItem,
  AppSettings,
  ProjectFolder,
} from '../domain/types';
import { loadAppState, resetAppState, saveAppState } from '../lib/storage';
import { createId } from '../lib/id';

type Action =
  | { type: 'hydrate'; payload: AppState }
  | { type: 'complete_onboarding' }
  | { type: 'set_pro_unlocked'; payload: { value: boolean } }
  | { type: 'create'; payload: CountdownItem }
  | { type: 'update'; payload: CountdownItem }
  | { type: 'rename'; payload: { id: string; title: string } }
  | { type: 'move_to_folder'; payload: { id: string; folderId: string } }
  | { type: 'move_to_trash'; payload: { id: string } }
  | { type: 'recover'; payload: { id: string; folderId: string } }
  | { type: 'remove_permanently'; payload: { id: string } }
  | { type: 'clean_trash' }
  | { type: 'toggle_archive'; payload: { id: string } }
  | { type: 'toggle_pin'; payload: { id: string } }
  | { type: 'create_folder'; payload: ProjectFolder }
  | { type: 'rename_folder'; payload: { id: string; name: string } }
  | { type: 'remove_folder'; payload: { id: string; fallbackFolderId: string } }
  | { type: 'update_settings'; payload: Partial<AppSettings> }
  | { type: 'replace_all'; payload: AppState };

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : 'Untitled countdown';
}

function normalizeFolderName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : 'Untitled folder';
}

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
    case 'rename':
      return {
        ...state,
        countdowns: state.countdowns.map(item => {
          if (item.id !== action.payload.id) {
            return item;
          }

          return {
            ...item,
            title: normalizeTitle(action.payload.title),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'move_to_folder':
      return {
        ...state,
        countdowns: state.countdowns.map(item => {
          if (item.id !== action.payload.id || item.trashedAt) {
            return item;
          }

          return {
            ...item,
            folderId: action.payload.folderId,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'move_to_trash':
      return {
        ...state,
        countdowns: state.countdowns.map(item => {
          if (item.id !== action.payload.id || item.trashedAt) {
            return item;
          }

          return {
            ...item,
            trashedAt: new Date().toISOString(),
            previousFolderId: item.folderId,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'recover':
      return {
        ...state,
        countdowns: state.countdowns.map(item => {
          if (item.id !== action.payload.id || !item.trashedAt) {
            return item;
          }

          return {
            ...item,
            folderId: action.payload.folderId,
            trashedAt: null,
            previousFolderId: null,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'remove_permanently':
      return {
        ...state,
        countdowns: state.countdowns.filter(item => item.id !== action.payload.id),
      };
    case 'clean_trash':
      return {
        ...state,
        countdowns: state.countdowns.filter(item => !item.trashedAt),
      };
    case 'toggle_archive':
      return {
        ...state,
        countdowns: state.countdowns.map(item => {
          if (item.id !== action.payload.id || item.trashedAt) {
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
          if (item.id !== action.payload.id || item.trashedAt) {
            return item;
          }

          return {
            ...item,
            pinned: !item.pinned,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'create_folder':
      return {
        ...state,
        folders: [action.payload, ...state.folders],
      };
    case 'rename_folder':
      return {
        ...state,
        folders: state.folders.map(folder => {
          if (folder.id !== action.payload.id) {
            return folder;
          }

          return {
            ...folder,
            name: normalizeFolderName(action.payload.name),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    case 'remove_folder': {
      const remainingFolders = state.folders.filter(folder => folder.id !== action.payload.id);
      if (remainingFolders.length === 0) {
        return state;
      }

      const fallbackFolderId = action.payload.fallbackFolderId;
      return {
        ...state,
        folders: remainingFolders,
        countdowns: state.countdowns.map(item => {
          const folderChanged = item.folderId === action.payload.id;
          const previousChanged = item.previousFolderId === action.payload.id;

          if (!folderChanged && !previousChanged) {
            return item;
          }

          return {
            ...item,
            folderId: folderChanged ? fallbackFolderId : item.folderId,
            previousFolderId: previousChanged ? fallbackFolderId : item.previousFolderId,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }
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
    renameCountdown: (id: string, title: string) => void;
    duplicateCountdown: (id: string) => void;
    moveCountdownToFolder: (id: string, folderId: string) => void;
    moveCountdownToTrash: (id: string) => void;
    recoverCountdown: (id: string) => void;
    removeCountdownPermanently: (id: string) => void;
    cleanTrash: () => void;
    addFromPreset: (preset: CountdownPreset) => CountdownItem;
    toggleArchive: (id: string) => void;
    togglePin: (id: string) => void;
    createFolder: (name: string) => ProjectFolder;
    renameFolder: (id: string, name: string) => void;
    removeFolder: (id: string) => boolean;
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
      renameCountdown: (id: string, title: string) =>
        dispatch({ type: 'rename', payload: { id, title } }),
      duplicateCountdown: (id: string) => {
        const source = state.countdowns.find(item => item.id === id);
        if (!source) {
          return;
        }

        const timestamp = new Date().toISOString();
        dispatch({
          type: 'create',
          payload: {
            ...source,
            id: createId('countdown'),
            title: `${normalizeTitle(source.title)} Copy`,
            pinned: false,
            archived: false,
            trashedAt: null,
            previousFolderId: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
      },
      moveCountdownToFolder: (id: string, folderId: string) => {
        if (!state.folders.some(folder => folder.id === folderId)) {
          return;
        }

        dispatch({ type: 'move_to_folder', payload: { id, folderId } });
      },
      moveCountdownToTrash: (id: string) => dispatch({ type: 'move_to_trash', payload: { id } }),
      recoverCountdown: (id: string) => {
        const item = state.countdowns.find(countdown => countdown.id === id);
        if (!item) {
          return;
        }

        const fallbackFolderId = state.folders[0]?.id ?? DEFAULT_FOLDER_ID;
        const desiredFolderId = item.previousFolderId ?? item.folderId;
        const targetFolderId = state.folders.some(folder => folder.id === desiredFolderId)
          ? desiredFolderId
          : fallbackFolderId;

        dispatch({ type: 'recover', payload: { id, folderId: targetFolderId } });
      },
      removeCountdownPermanently: (id: string) =>
        dispatch({ type: 'remove_permanently', payload: { id } }),
      cleanTrash: () => dispatch({ type: 'clean_trash' }),
      addFromPreset: (preset: CountdownPreset) => {
        const firstFolderId = state.folders[0]?.id ?? DEFAULT_FOLDER_ID;
        const item = createCountdownFromPreset(preset, new Date(), firstFolderId);
        dispatch({ type: 'create', payload: item });
        return item;
      },
      toggleArchive: (id: string) => dispatch({ type: 'toggle_archive', payload: { id } }),
      togglePin: (id: string) => dispatch({ type: 'toggle_pin', payload: { id } }),
      createFolder: (name: string) => {
        const timestamp = new Date().toISOString();
        const folder: ProjectFolder = {
          id: createId('folder'),
          name: normalizeFolderName(name),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        dispatch({ type: 'create_folder', payload: folder });
        return folder;
      },
      renameFolder: (id: string, name: string) =>
        dispatch({ type: 'rename_folder', payload: { id, name } }),
      removeFolder: (id: string) => {
        const fallbackFolder = state.folders.find(folder => folder.id !== id);
        if (!fallbackFolder) {
          return false;
        }

        dispatch({
          type: 'remove_folder',
          payload: { id, fallbackFolderId: fallbackFolder.id },
        });
        return true;
      },
      updateSettings: (settings: Partial<AppSettings>) =>
        dispatch({ type: 'update_settings', payload: settings }),
      resetState: async () => {
        const freshState = await resetAppState();
        dispatch({ type: 'replace_all', payload: freshState });
      },
      importState: (nextState: AppState) =>
        dispatch({ type: 'replace_all', payload: nextState }),
    }),
    [state.countdowns, state.folders],
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
      const firstInTrash = Boolean(first.trashedAt);
      const secondInTrash = Boolean(second.trashedAt);

      if (firstInTrash !== secondInTrash) {
        return firstInTrash ? 1 : -1;
      }

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
