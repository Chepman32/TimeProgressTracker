import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ResolvedPalette } from '../domain/palette';
import {
  ALL_PROJECTS_FOLDER_ID,
  ALL_PROJECTS_FOLDER_NAME,
  TRASH_FOLDER_ID,
  TRASH_FOLDER_NAME,
} from '../domain/folders';
import { CountdownItem, ProjectFolder } from '../domain/types';
import { getThemeById } from '../domain/themes';
import { calculateCountdownMetrics, formatDurationShort, getPeriodProgress } from '../lib/date';
import { CountdownCard } from '../components/CountdownCard';
import { SegmentedControl } from '../components/SegmentedControl';

interface DashboardScreenProps {
  countdowns: CountdownItem[];
  folders: ProjectFolder[];
  now: Date;
  weekStartsOnMonday: boolean;
  defaultShowArchived: boolean;
  palette: ResolvedPalette;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRenameProject: (id: string, title: string) => void;
  onDuplicateProject: (id: string) => void;
  onMoveProjectToFolder: (id: string, folderId: string) => void;
  onMoveProjectToTrash: (id: string) => void;
  onRecoverProject: (id: string) => void;
  onRemoveProjectPermanently: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onRemoveFolder: (id: string) => boolean;
}

type FilterMode = 'active' | 'all' | 'archived';

interface FolderSection {
  id: string;
  name: string;
  items: CountdownItem[];
  isSystem: boolean;
}

const FILTER_OPTIONS: Array<{ value: FilterMode; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
  { value: 'archived', label: 'Archived' },
];

export function DashboardScreen({
  countdowns,
  folders,
  now,
  weekStartsOnMonday,
  defaultShowArchived,
  palette,
  onCreate,
  onOpen,
  onTogglePin,
  onRenameProject,
  onDuplicateProject,
  onMoveProjectToFolder,
  onMoveProjectToTrash,
  onRecoverProject,
  onRemoveProjectPermanently,
  onRenameFolder,
  onRemoveFolder,
}: DashboardScreenProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>(
    defaultShowArchived ? 'all' : 'active',
  );
  const [query, setQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    [ALL_PROJECTS_FOLDER_ID]: true,
  });

  const normalizedQuery = query.trim().toLowerCase();

  const periodProgress = useMemo(() => {
    return [
      getPeriodProgress('day', now, weekStartsOnMonday),
      getPeriodProgress('week', now, weekStartsOnMonday),
      getPeriodProgress('month', now, weekStartsOnMonday),
      getPeriodProgress('year', now, weekStartsOnMonday),
    ];
  }, [now, weekStartsOnMonday]);

  const regularProjects = useMemo(() => {
    return countdowns.filter(item => {
      if (item.trashedAt) {
        return false;
      }

      if (filterMode === 'active' && item.archived) {
        return false;
      }

      if (filterMode === 'archived' && !item.archived) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.notes.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [countdowns, filterMode, normalizedQuery]);

  const trashProjects = useMemo(() => {
    return countdowns.filter(item => {
      if (!item.trashedAt) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.notes.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [countdowns, normalizedQuery]);

  const hasTrash = trashProjects.length > 0;

  const sections = useMemo(() => {
    const byFolderId = regularProjects.reduce<Record<string, CountdownItem[]>>((acc, item) => {
      if (!acc[item.folderId]) {
        acc[item.folderId] = [];
      }

      acc[item.folderId].push(item);
      return acc;
    }, {});

    const folderSections: FolderSection[] = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      items: byFolderId[folder.id] ?? [],
      isSystem: false,
    }));

    const allProjectsSection: FolderSection = {
      id: ALL_PROJECTS_FOLDER_ID,
      name: ALL_PROJECTS_FOLDER_NAME,
      items: regularProjects,
      isSystem: true,
    };

    if (trashProjects.length === 0) {
      return [allProjectsSection, ...folderSections];
    }

    return [
      allProjectsSection,
      ...folderSections,
      {
        id: TRASH_FOLDER_ID,
        name: TRASH_FOLDER_NAME,
        items: trashProjects,
        isSystem: true,
      },
    ];
  }, [folders, regularProjects, trashProjects]);

  useEffect(() => {
    setExpandedFolders(current => {
      const next = { ...current };

      next[ALL_PROJECTS_FOLDER_ID] = next[ALL_PROJECTS_FOLDER_ID] ?? true;

      folders.forEach(folder => {
        if (!(folder.id in next)) {
          next[folder.id] = false;
        }
      });

      if (hasTrash && !(TRASH_FOLDER_ID in next)) {
        next[TRASH_FOLDER_ID] = false;
      }

      return next;
    });
  }, [folders, hasTrash]);

  const promptForText = (
    title: string,
    message: string,
    currentValue: string,
    onSubmit: (value: string) => void,
  ) => {
    if (Platform.OS !== 'ios') {
      return;
    }

    Alert.prompt(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: value => {
            if (typeof value !== 'string') {
              return;
            }

            const next = value.trim();
            if (!next) {
              return;
            }

            onSubmit(next);
          },
        },
      ],
      'plain-text',
      currentValue,
    );
  };

  const onRequestMoveToFolder = (project: CountdownItem) => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const targets = folders.filter(folder => folder.id !== project.folderId);
    if (targets.length === 0) {
      Alert.alert('No other folders', 'Create another folder before moving this project.');
      return;
    }

    const cancelButtonIndex = targets.length;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Move to Folder',
        options: [...targets.map(folder => folder.name), 'Cancel'],
        cancelButtonIndex,
      },
      selectedIndex => {
        if (selectedIndex === undefined || selectedIndex === cancelButtonIndex) {
          return;
        }

        const target = targets[selectedIndex];
        if (!target) {
          return;
        }

        onMoveProjectToFolder(project.id, target.id);
      },
    );
  };

  const onLongPressProject = (project: CountdownItem) => {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (project.trashedAt) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: project.title,
          options: ['Recover', 'Remove Permanently', 'Cancel'],
          cancelButtonIndex: 2,
          destructiveButtonIndex: 1,
        },
        selectedIndex => {
          if (selectedIndex === 0) {
            onRecoverProject(project.id);
          }

          if (selectedIndex === 1) {
            Alert.alert(
              'Remove permanently?',
              'This project will be deleted forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => onRemoveProjectPermanently(project.id),
                },
              ],
            );
          }
        },
      );
      return;
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: project.title,
        options: ['Rename', 'Duplicate', 'Move to folder', 'Remove', 'Cancel'],
        cancelButtonIndex: 4,
        destructiveButtonIndex: 3,
      },
      selectedIndex => {
        if (selectedIndex === 0) {
          promptForText('Rename project', 'Set a new project name.', project.title, value => {
            onRenameProject(project.id, value);
          });
        }

        if (selectedIndex === 1) {
          onDuplicateProject(project.id);
        }

        if (selectedIndex === 2) {
          onRequestMoveToFolder(project);
        }

        if (selectedIndex === 3) {
          Alert.alert('Move to Trash?', 'You can recover it later from Trash.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Move to Trash',
              style: 'destructive',
              onPress: () => onMoveProjectToTrash(project.id),
            },
          ]);
        }
      },
    );
  };

  const onLongPressFolder = (folder: ProjectFolder) => {
    if (Platform.OS !== 'ios') {
      return;
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: folder.name,
        options: ['Rename', 'Remove', 'Cancel'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      selectedIndex => {
        if (selectedIndex === 0) {
          promptForText('Rename folder', 'Set a new folder name.', folder.name, value => {
            onRenameFolder(folder.id, value);
          });
        }

        if (selectedIndex === 1) {
          Alert.alert(
            'Remove folder?',
            'Projects in this folder will be moved to another folder.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  const didRemove = onRemoveFolder(folder.id);
                  if (!didRemove) {
                    Alert.alert('Cannot remove folder', 'At least one folder must remain.');
                  }
                },
              },
            ],
          );
        }
      },
    );
  };

  const allVisibleProjectsCount = regularProjects.length + trashProjects.length;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerStack}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.overline, { color: palette.textSecondary }]}>Pretty Progress</Text>
            <Text style={[styles.title, { color: palette.textPrimary }]}>Your Timers</Text>
          </View>
          <Pressable
            style={[styles.createButton, { backgroundColor: palette.textPrimary }]}
            onPress={onCreate}>
            <Text style={styles.createButtonText}>＋</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="Search countdowns"
          placeholderTextColor={palette.textTertiary}
          style={[
            styles.search,
            {
              color: palette.textPrimary,
              borderColor: palette.border,
              backgroundColor: palette.floatingBackground,
            },
          ]}
          value={query}
          onChangeText={setQuery}
        />

        <SegmentedControl
          options={FILTER_OPTIONS}
          selected={filterMode}
          onChange={setFilterMode}
          backgroundColor={palette.floatingBackground}
          activeColor={palette.textPrimary}
          textColor={palette.textSecondary}
          activeTextColor={palette.isDark ? '#06060b' : '#ffffff'}
        />

        <View style={styles.metricsRow}>
          {periodProgress.map(progress => {
            const percentage = Math.round(progress.progress * 100);

            return (
              <View
                key={progress.period}
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: palette.floatingBackground,
                    borderColor: palette.border,
                  },
                ]}>
                <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                  {progress.label}
                </Text>
                <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                  {percentage}%
                </Text>
                <Text style={[styles.metricSub, { color: palette.textTertiary }]}>
                  {formatDurationShort(progress.remainingMs)} left
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {allVisibleProjectsCount === 0 ? (
        <View
          style={[
            styles.empty,
            {
              backgroundColor: palette.floatingBackground,
              borderColor: palette.border,
            },
          ]}>
          <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No countdowns</Text>
          <Text style={[styles.emptySub, { color: palette.textSecondary }]}>
            Create a timer or add one from the library.
          </Text>
          <Pressable
            onPress={onCreate}
            style={[styles.emptyAction, { backgroundColor: palette.textPrimary }]}>
            <Text style={styles.emptyActionText}>Create countdown</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.folderStack}>
          {sections.map(section => {
            const isExpanded = expandedFolders[section.id] ?? false;
            const folder = folders.find(item => item.id === section.id);
            const canManageFolder = !section.isSystem && Boolean(folder);

            return (
              <View
                key={section.id}
                style={[
                  styles.folderSection,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.floatingBackground,
                  },
                ]}>
                <Pressable
                  style={styles.folderHeader}
                  onPress={() =>
                    setExpandedFolders(current => ({
                      ...current,
                      [section.id]: !(current[section.id] ?? false),
                    }))
                  }
                  onLongPress={
                    canManageFolder && folder
                      ? () => onLongPressFolder(folder)
                      : undefined
                  }
                  delayLongPress={300}>
                  <View style={styles.folderTitleWrap}>
                    <Text style={[styles.folderTitle, { color: palette.textPrimary }]}>
                      {section.name}
                    </Text>
                    <Text style={[styles.folderCount, { color: palette.textSecondary }]}>
                      {section.items.length}
                    </Text>
                  </View>
                  <Text style={[styles.folderChevron, { color: palette.textSecondary }]}>
                    {isExpanded ? '▾' : '▸'}
                  </Text>
                </Pressable>

                {isExpanded ? (
                  section.items.length > 0 ? (
                    <View style={styles.folderItems}>
                      {section.items.map((item, index) => {
                        const metrics = calculateCountdownMetrics(item, now);
                        const theme = getThemeById(item.themeId);

                        return (
                          <CountdownCard
                            key={`${section.id}-${item.id}`}
                            item={item}
                            metrics={metrics}
                            theme={theme}
                            index={index}
                            onPress={() => onOpen(item.id)}
                            onLongPress={() => onLongPressProject(item)}
                            showPinButton={!item.trashedAt}
                            onTogglePin={() => onTogglePin(item.id)}
                          />
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={[styles.emptyFolderText, { color: palette.textSecondary }]}>
                      No projects in this folder.
                    </Text>
                  )
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    paddingTop: 8,
    gap: 12,
  },
  headerStack: {
    gap: 14,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    gap: 2,
  },
  overline: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    letterSpacing: -0.6,
    fontWeight: '800',
  },
  createButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '600',
  },
  search: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    minWidth: '48%',
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metricSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 18,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  emptySub: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 4,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  folderStack: {
    gap: 10,
  },
  folderSection: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  folderCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  folderChevron: {
    fontSize: 18,
    fontWeight: '700',
  },
  folderItems: {
    paddingTop: 2,
  },
  emptyFolderText: {
    fontSize: 13,
    fontWeight: '600',
    paddingBottom: 4,
  },
});
