import { ProjectFolder } from './types';
import { createId } from '../lib/id';

export const ALL_PROJECTS_FOLDER_ID = 'system:all-projects';
export const TRASH_FOLDER_ID = 'system:trash';
export const DEFAULT_FOLDER_ID = 'folder:default';
export const DEFAULT_FOLDER_NAME = 'Projects';
export const ALL_PROJECTS_FOLDER_NAME = 'All Projects';
export const TRASH_FOLDER_NAME = 'Trash';

export function createDefaultFolder(nowDate = new Date()): ProjectFolder {
  const timestamp = nowDate.toISOString();
  return {
    id: DEFAULT_FOLDER_ID,
    name: DEFAULT_FOLDER_NAME,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createFolder(name: string, nowDate = new Date()): ProjectFolder {
  const timestamp = nowDate.toISOString();
  return {
    id: createId('folder'),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
