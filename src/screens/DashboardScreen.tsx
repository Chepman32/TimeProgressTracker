import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
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
import { ProgressRing } from '../components/ProgressRing';
import { MenuView, MenuAction } from '@react-native-menu/menu';
import { isSameDay, endOfWeek, endOfMonth } from 'date-fns';

interface DashboardScreenProps {
  countdowns: CountdownItem[];
  folders: ProjectFolder[];
  now: Date;
  weekStartsOnMonday: boolean;
  defaultShowArchived: boolean;
  palette: ResolvedPalette;
  onCreate: () => void;
  onCreateFolder: (name: string) => ProjectFolder;
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
  onVisualize: (id: string) => void;
}

type FilterMode = 'active' | 'all' | 'archived';
type SortMode = 'createdAt' | 'updatedAt' | 'completion';
type EndDateFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth';

interface FolderSection {
  id: string;
  name: string;
  items: CountdownItem[];
  isSystem: boolean;
}

interface PendingPinFocus {
  itemKey: string;
  anchorWindowY: number;
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
  onCreateFolder,
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
  onVisualize,
}: DashboardScreenProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>(
    defaultShowArchived ? 'all' : 'active',
  );
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('createdAt');
  const [endDateFilter, setEndDateFilter] = useState<EndDateFilter>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    [ALL_PROJECTS_FOLDER_ID]: true,
  });
  const [pendingPinFocus, setPendingPinFocus] = useState<PendingPinFocus | null>(null);
  const [isCreateFolderModalVisible, setCreateFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [pendingMoveProject, setPendingMoveProject] = useState<CountdownItem | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffsetYRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const itemRefsRef = useRef<Record<string, View | null>>({});

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

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
    let items = countdowns.filter(item => {
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

    if (endDateFilter !== 'all') {
      items = items.filter(item => {
        const target = new Date(item.targetDate);
        if (endDateFilter === 'today') {
          return isSameDay(target, now);
        }
        if (endDateFilter === 'thisWeek') {
          return target >= now && target <= endOfWeek(now, { weekStartsOn: 1 });
        }
        if (endDateFilter === 'thisMonth') {
          return target >= now && target <= endOfMonth(now);
        }
        return true;
      });
    }

    items = [...items].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      switch (sortMode) {
        case 'createdAt':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'completion': {
          const aProgress = calculateCountdownMetrics(a, now).progress;
          const bProgress = calculateCountdownMetrics(b, now).progress;
          return bProgress - aProgress;
        }
      }
    });

    return items;
  }, [countdowns, filterMode, normalizedQuery, endDateFilter, sortMode, now]);

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

  useEffect(() => {
    if (!pendingPinFocus) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      const itemRef = itemRefsRef.current[pendingPinFocus.itemKey];
      const scroll = scrollRef.current;
      const viewportHeight = viewportHeightRef.current;
      if (!itemRef || !scroll || viewportHeight <= 0) {
        setPendingPinFocus(null);
        return;
      }

      itemRef.measureInWindow((_x, nextWindowY) => {
        const deltaY = nextWindowY - pendingPinFocus.anchorWindowY;
        if (Math.abs(deltaY) < 1) {
          setPendingPinFocus(null);
          return;
        }

        const maxOffsetY = Math.max(contentHeightRef.current - viewportHeight, 0);
        const nextOffsetY = Math.min(
          Math.max(scrollOffsetYRef.current + deltaY, 0),
          maxOffsetY,
        );
        scroll.scrollTo({ y: nextOffsetY, animated: true });
        scrollOffsetYRef.current = nextOffsetY;
        setPendingPinFocus(null);
      });
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [pendingPinFocus, sections]);

  const handleProjectAction = (actionId: string, item: CountdownItem) => {
    if (actionId === 'recover') {
      onRecoverProject(item.id);
    } else if (actionId === 'remove-permanently') {
      Alert.alert('Remove permanently?', 'This project will be deleted forever.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemoveProjectPermanently(item.id) },
      ]);
    } else if (actionId === 'rename') {
      Alert.prompt(
        'Rename project',
        'Set a new project name.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (value?: string) => {
              const next = value?.trim();
              if (next) { onRenameProject(item.id, next); }
            },
          },
        ],
        'plain-text',
        item.title,
      );
    } else if (actionId === 'duplicate') {
      onDuplicateProject(item.id);
    } else if (actionId === 'remove') {
      onMoveProjectToTrash(item.id);
    } else if (actionId.startsWith('move-')) {
      const folderId = actionId.slice(5);
      onMoveProjectToFolder(item.id, folderId);
    }
  };

  const onRequestMoveToFolder = (project: CountdownItem) => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const targets = folders.filter(folder => folder.id !== project.folderId);
    if (targets.length === 0) {
      setPendingMoveProject(project);
      setNewFolderName('');
      setCreateFolderModalVisible(true);
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

        handleProjectAction(`move-${target.id}`, project);
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
          options: ['Visualize', 'Recover', 'Remove Permanently', 'Cancel'],
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
        },
        selectedIndex => {
          if (selectedIndex === 0) {
            onVisualize(project.id);
          }

          if (selectedIndex === 1) {
            handleProjectAction('recover', project);
          }

          if (selectedIndex === 2) {
            handleProjectAction('remove-permanently', project);
          }
        },
      );
      return;
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: project.title,
        options: ['Visualize', 'Rename', 'Duplicate', 'Move to Folder', 'Move to Trash', 'Cancel'],
        cancelButtonIndex: 5,
        destructiveButtonIndex: 4,
      },
      selectedIndex => {
        if (selectedIndex === 0) {
          onVisualize(project.id);
        }

        if (selectedIndex === 1) {
          handleProjectAction('rename', project);
        }

        if (selectedIndex === 2) {
          handleProjectAction('duplicate', project);
        }

        if (selectedIndex === 3) {
          onRequestMoveToFolder(project);
        }

        if (selectedIndex === 4) {
          handleProjectAction('remove', project);
        }
      },
    );
  };

  const buildFolderActions = (): MenuAction[] => [
    { id: 'rename-folder', title: 'Rename', image: 'pencil' },
    { id: 'remove-folder', title: 'Remove', image: 'trash', attributes: { destructive: true } },
  ];

  const handleFolderAction = (actionId: string, folder: ProjectFolder) => {
    if (actionId === 'rename-folder') {
      Alert.prompt(
        'Rename folder',
        'Set a new folder name.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (value?: string) => {
              const next = value?.trim();
              if (next) { onRenameFolder(folder.id, next); }
            },
          },
        ],
        'plain-text',
        folder.name,
      );
    } else if (actionId === 'remove-folder') {
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
  };

  const allVisibleProjectsCount = regularProjects.length + trashProjects.length;
  const onPressCreateFolder = () => {
    setPendingMoveProject(null);
    setNewFolderName('');
    setCreateFolderModalVisible(true);
  };

  const onCloseCreateFolderModal = () => {
    setCreateFolderModalVisible(false);
    setNewFolderName('');
    setPendingMoveProject(null);
  };

  const onSubmitCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) {
      return;
    }

    const createdFolder = onCreateFolder(name);
    if (pendingMoveProject) {
      onMoveProjectToFolder(pendingMoveProject.id, createdFolder.id);
    }

    onCloseCreateFolderModal();
  };

  const onTogglePinWithAnimation = (sectionId: string, id: string) => {
    const itemKey = `${sectionId}-${id}`;
    const itemRef = itemRefsRef.current[itemKey];
    if (itemRef) {
      itemRef.measureInWindow((_x, anchorWindowY) => {
        setPendingPinFocus({ itemKey, anchorWindowY });
      });
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onTogglePin(id);
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={event => {
          scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
        }}
        onLayout={event => {
          viewportHeightRef.current = event.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_, contentHeight) => {
          contentHeightRef.current = contentHeight;
        }}>
        <View style={styles.headerStack}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.appName, { color: palette.textPrimary }]}>Pretty Progress</Text>
          </View>
          <View style={styles.headerActions}>
            <MenuView
              onPressAction={({ nativeEvent }) => {
                const id = nativeEvent.event;
                if (id === 'sort-createdAt') { setSortMode('createdAt'); }
                if (id === 'sort-updatedAt') { setSortMode('updatedAt'); }
                if (id === 'sort-completion') { setSortMode('completion'); }
                if (id === 'filter-all') { setEndDateFilter('all'); }
                if (id === 'filter-today') { setEndDateFilter('today'); }
                if (id === 'filter-thisWeek') { setEndDateFilter('thisWeek'); }
                if (id === 'filter-thisMonth') { setEndDateFilter('thisMonth'); }
              }}
              actions={[
                {
                  id: 'sortGroup',
                  title: 'Sort by',
                  subactions: [
                    { id: 'sort-createdAt', title: 'Created', state: sortMode === 'createdAt' ? 'on' : 'off' },
                    { id: 'sort-updatedAt', title: 'Updated', state: sortMode === 'updatedAt' ? 'on' : 'off' },
                    { id: 'sort-completion', title: 'Completion %', state: sortMode === 'completion' ? 'on' : 'off' },
                  ],
                },
                {
                  id: 'filterGroup',
                  title: 'Filtering',
                  subactions: [
                    { id: 'filter-today', title: 'Today', state: endDateFilter === 'today' ? 'on' : 'off' },
                    { id: 'filter-thisWeek', title: 'This week', state: endDateFilter === 'thisWeek' ? 'on' : 'off' },
                    { id: 'filter-thisMonth', title: 'This month', state: endDateFilter === 'thisMonth' ? 'on' : 'off' },
                    { id: 'filter-all', title: 'All', state: endDateFilter === 'all' ? 'on' : 'off' },
                  ],
                },
              ]}>
              <Pressable
                style={[
                  styles.menuButton,
                  { borderColor: palette.border, backgroundColor: palette.floatingBackground },
                ]}>
                <Text style={[styles.menuButtonText, { color: palette.textPrimary }]}>•••</Text>
              </Pressable>
            </MenuView>
            <Pressable
              style={[
                styles.addFolderHeaderButton,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.floatingBackground,
                },
              ]}
              onPress={onPressCreateFolder}>
              <Text style={[styles.addFolderHeaderButtonText, { color: palette.textPrimary }]}>
                Add Folder
              </Text>
            </Pressable>
            <Pressable
              style={[styles.createButton, { backgroundColor: palette.textPrimary }]}
              onPress={onCreate}>
              <Text style={styles.createButtonText}>＋</Text>
            </Pressable>
          </View>
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
            const ringTrackColor = palette.isDark
              ? 'rgba(194, 204, 255, 0.2)'
              : 'rgba(15, 19, 36, 0.1)';
            const ringFillColor = palette.isDark ? '#f7f8ff' : '#0f1324';

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
                <View style={styles.metricHeader}>
                  <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                    {progress.label}
                  </Text>
                  <ProgressRing
                    size={48}
                    strokeWidth={6}
                    progress={progress.progress}
                    trackColor={ringTrackColor}
                    fillColor={ringFillColor}
                  />
                </View>
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
                {canManageFolder && folder ? (
                  <MenuView
                    shouldOpenOnLongPress
                    actions={buildFolderActions()}
                    onPressAction={({ nativeEvent }) =>
                      handleFolderAction(nativeEvent.event, folder)
                    }>
                    <Pressable
                      style={styles.folderHeader}
                      onPress={() =>
                        setExpandedFolders(current => ({
                          ...current,
                          [section.id]: !(current[section.id] ?? false),
                        }))
                      }>
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
                  </MenuView>
                ) : (
                  <Pressable
                    style={styles.folderHeader}
                    onPress={() =>
                      setExpandedFolders(current => ({
                        ...current,
                        [section.id]: !(current[section.id] ?? false),
                      }))
                    }>
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
                )}

                {isExpanded ? (
                  section.items.length > 0 ? (
                    <View style={styles.folderItems}>
                      {section.items.map((item, index) => {
                        const metrics = calculateCountdownMetrics(item, now);
                        const theme = getThemeById(item.themeId);

                        const itemKey = `${section.id}-${item.id}`;
                        return (
                          <View
                            key={itemKey}
                            ref={node => {
                              if (node) {
                                itemRefsRef.current[itemKey] = node;
                                return;
                              }
                              delete itemRefsRef.current[itemKey];
                            }}>
                            <CountdownCard
                              item={item}
                              metrics={metrics}
                              theme={theme}
                              index={index}
                              onPress={() => onOpen(item.id)}
                              onLongPress={() => onLongPressProject(item)}
                              showPinButton={!item.trashedAt}
                              onTogglePin={() => onTogglePinWithAnimation(section.id, item.id)}
                            />
                          </View>
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

      <Modal
        transparent
        animationType="fade"
        visible={isCreateFolderModalVisible}
        onRequestClose={onCloseCreateFolderModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCloseCreateFolderModal} />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Create folder</Text>
            <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
              {pendingMoveProject
                ? 'Create a folder to move this project.'
                : 'Enter a folder name.'}
            </Text>
            <TextInput
              autoFocus
              placeholder="Folder name"
              placeholderTextColor={palette.textTertiary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              style={[
                styles.modalInput,
                {
                  color: palette.textPrimary,
                  borderColor: palette.border,
                  backgroundColor: palette.pageBackground,
                },
              ]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={onCloseCreateFolderModal}
                style={[
                  styles.modalButton,
                  { borderColor: palette.border, backgroundColor: palette.pageBackground },
                ]}>
                <Text style={[styles.modalButtonText, { color: palette.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={onSubmitCreateFolder}
                style={[
                  styles.modalButton,
                  styles.modalPrimaryButton,
                  { backgroundColor: palette.textPrimary },
                ]}>
                <Text style={styles.modalPrimaryButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleWrap: {
    gap: 2,
    flex: 1,
  },
  appName: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.6,
    fontWeight: '700',
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 13,
    letterSpacing: 1,
    fontWeight: '600',
  },
  addFolderHeaderButton: {
    borderWidth: 1,
    borderRadius: 13,
    height: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFolderHeaderButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  search: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricCard: {
    minWidth: '47.5%',
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    minHeight: 172,
    gap: 6,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    marginTop: 2,
    fontSize: 54,
    fontWeight: '600',
    letterSpacing: -1.2,
    lineHeight: 58,
  },
  metricSub: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '700',
  },
  folderCount: {
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '500',
    paddingBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 8, 20, 0.4)',
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  modalButton: {
    minWidth: 88,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalPrimaryButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
