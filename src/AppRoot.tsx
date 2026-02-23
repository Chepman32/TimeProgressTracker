import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from './components/AppBackground';
import { BottomTabBar } from './components/BottomTabBar';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { resolvePalette } from './domain/palette';
import { UNASSIGNED_FOLDER_ID } from './domain/folders';
import { AppTab, CountdownItem } from './domain/types';
import { getThemeById } from './domain/themes';
import { createCountdownFromPreset } from './domain/factories';
import {
  useCountdownById,
  useCountdownStore,
  useDebouncedNow,
  useSortedCountdowns,
} from './hooks/useCountdownStore';
import {
  checkNotificationPermissions,
  clearAllNotificationBadges,
  fireDebugNotification,
  getPendingNotificationRequestCount,
  requestNotificationPermissions,
  syncLocalNotifications,
} from './lib/notifications';
import { DashboardScreen } from './screens/DashboardScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CountdownEditorModal } from './screens/CountdownEditorModal';
import { CountdownDetailModal } from './screens/CountdownDetailModal';
import { DotGridModal } from './screens/DotGridModal';
import { NotificationsSettingsModal } from './screens/NotificationsSettingsModal';

export function AppRoot() {
  const { isReady, state, actions } = useCountdownStore();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme() === 'dark';
  const now = useDebouncedNow(1000);

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorInitialCountdown, setEditorInitialCountdown] = useState<CountdownItem | undefined>();
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [isBackupModalOpen, setBackupModalOpen] = useState(false);
  const [isNotificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [visualizeId, setVisualizeId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const sortedCountdowns = useSortedCountdowns(state.countdowns);
  const activeCountdowns = useMemo(
    () => sortedCountdowns.filter(item => !item.trashedAt),
    [sortedCountdowns],
  );
  const detailItem = useCountdownById(sortedCountdowns, detailId);
  const editingItem = useCountdownById(sortedCountdowns, editorId);
  const visualizeItem = useCountdownById(sortedCountdowns, visualizeId);

  const palette = useMemo(
    () => resolvePalette(state.settings.appearance, systemColorScheme),
    [state.settings.appearance, systemColorScheme],
  );

  const baseTheme = getThemeById(activeCountdowns[0]?.themeId ?? sortedCountdowns[0]?.themeId ?? 'swiss');
  const accent = state.settings.accentColor;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    checkNotificationPermissions()
      .then(permissions => {
        setNotificationsEnabled(Boolean(permissions.alert || permissions.sound));
      })
      .catch(() => {
        setNotificationsEnabled(false);
      });

    clearAllNotificationBadges();
  }, [isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    syncLocalNotifications(activeCountdowns);
  }, [activeCountdowns, isReady, notificationsEnabled]);

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.pageBackground }]}> 
        <Text style={[styles.loadingText, { color: palette.textPrimary }]}>Preparing Pretty Progress…</Text>
      </View>
    );
  }

  const openCreateModal = () => {
    setEditorId(null);
    setEditorInitialCountdown(undefined);
    setEditorOpen(true);
  };

  const openEditModal = (id: string) => {
    setDetailId(null);
    setEditorId(id);
    setEditorInitialCountdown(undefined);
    setEditorOpen(true);
  };

  const onSaveCountdown = (item: CountdownItem): boolean => {
    const exists = sortedCountdowns.some(countdown => countdown.id === item.id);
    if (exists) {
      actions.updateCountdown(item);
      return true;
    }

    actions.addCountdown(item);
    requestNotificationPermissions()
      .then(granted => {
        setNotificationsEnabled(granted);
      })
      .catch(() => {
        setNotificationsEnabled(false);
      });
    return true;
  };

  const onDeleteCountdown = (id: string) => {
    const target = sortedCountdowns.find(countdown => countdown.id === id);
    if (!target) {
      return;
    }

    if (target.trashedAt) {
      Alert.alert('Remove permanently?', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            actions.removeCountdownPermanently(id);
            setDetailId(null);
          },
        },
      ]);
      return;
    }

    Alert.alert('Move countdown to Trash?', 'You can recover it later from Trash.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Move to Trash',
        style: 'destructive',
        onPress: () => {
          actions.moveCountdownToTrash(id);
          setDetailId(null);
        },
      },
    ]);
  };

  const onRequestNotifications = async () => {
    try {
      const granted = await requestNotificationPermissions();
      setNotificationsEnabled(granted);
      if (granted) {
        syncLocalNotifications(activeCountdowns);
        Alert.alert('Notifications enabled', 'Countdown reminders are now active.');
      } else {
        Alert.alert('Notifications disabled', 'Enable notifications in iOS Settings for reminders.');
      }
    } catch {
      setNotificationsEnabled(false);
      Alert.alert('Notifications error', 'Could not update notification permissions right now.');
    }
  };

  const onOpenNotificationsScreen = async () => {
    if (!notificationsEnabled) {
      try {
        const granted = await requestNotificationPermissions();
        setNotificationsEnabled(granted);
        if (!granted) {
          Alert.alert('Notifications disabled', 'Enable notifications in iOS Settings to use reminders.');
          return;
        }
        syncLocalNotifications(activeCountdowns);
      } catch {
        Alert.alert('Notifications error', 'Could not request notification permissions right now.');
        return;
      }
    }
    setNotificationsModalOpen(true);
  };

  const onSendTestNotification = async () => {
    try {
      const granted = await requestNotificationPermissions();
      setNotificationsEnabled(granted);

      if (!granted) {
        Alert.alert('Notifications disabled', 'Enable notifications in iOS Settings for reminders.');
        return;
      }

      fireDebugNotification();
      const pending = await getPendingNotificationRequestCount();
      Alert.alert(
        'Test notification scheduled',
        `A local notification should appear in ~5 seconds. Pending requests: ${pending}.`,
      );
    } catch {
      Alert.alert('Notifications error', 'Failed to schedule the test notification.');
    }
  };

  return (
    <AppBackground colors={baseTheme.colors.appBackground} isDark={palette.isDark}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <>
            <View style={styles.screenArea}>
              {activeTab === 'dashboard' ? (
                <DashboardScreen
                  countdowns={sortedCountdowns}
                  folders={state.folders}
                  now={now}
                  weekStartsOnMonday={state.settings.weekStartsOnMonday}
                  defaultShowArchived={state.settings.showArchivedByDefault}
                  palette={palette}
                  onCreate={openCreateModal}
                  onCreateFolder={actions.createFolder}
                  onOpen={setDetailId}
                  onTogglePin={actions.togglePin}
                  onRenameProject={actions.renameCountdown}
                  onDuplicateProject={actions.duplicateCountdown}
                  onMoveProjectToFolder={actions.moveCountdownToFolder}
                  onMoveProjectToTrash={actions.moveCountdownToTrash}
                  onRecoverProject={actions.recoverCountdown}
                  onRemoveProjectPermanently={actions.removeCountdownPermanently}
                  onRenameFolder={actions.renameFolder}
                  onRemoveFolder={actions.removeFolder}
                  onVisualize={setVisualizeId}
                />
              ) : null}

              {activeTab === 'library' ? (
                <LibraryScreen
                  palette={palette}
                  onUsePreset={preset => {
                    const folderId = state.folders[0]?.id ?? UNASSIGNED_FOLDER_ID;
                    const seeded = createCountdownFromPreset(preset, new Date(), folderId);
                    seeded.notifications = { ...state.settings.notificationDefaults };
                    setEditorId(null);
                    setEditorInitialCountdown(seeded);
                    setEditorOpen(true);
                  }}
                />
              ) : null}

              {activeTab === 'timeline' ? (
                <TimelineScreen
                  countdowns={activeCountdowns}
                  now={now}
                  palette={palette}
                  onOpen={setDetailId}
                />
              ) : null}

              {activeTab === 'settings' ? (
                <SettingsScreen
                  settings={state.settings}
                  notificationsEnabled={notificationsEnabled}
                  palette={palette}
                  accentColor={accent}
                  onUpdateSettings={actions.updateSettings}
                  onResetData={actions.resetState}
                  onOpenBackup={() => setBackupModalOpen(true)}
                  onOpenNotifications={onOpenNotificationsScreen}
                />
              ) : null}
            </View>

            <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
              <BottomTabBar
                activeTab={activeTab}
                onChangeTab={setActiveTab}
                palette={palette}
                accentColor={accent}
              />
            </View>
          </>

        <CountdownEditorModal
          visible={isEditorOpen}
          palette={palette}
          defaultFolderId={state.folders[0]?.id ?? UNASSIGNED_FOLDER_ID}
          defaultNotifications={state.settings.notificationDefaults}
          countdown={editingItem}
          initialCountdown={editorInitialCountdown}
          onClose={() => {
            setEditorOpen(false);
            setEditorId(null);
            setEditorInitialCountdown(undefined);
          }}
          onSave={onSaveCountdown}
        />

        <CountdownDetailModal
          visible={Boolean(detailItem)}
          item={detailItem}
          now={now}
          palette={palette}
          onClose={() => setDetailId(null)}
          onEdit={openEditModal}
          onTogglePin={actions.togglePin}
          onToggleArchive={actions.toggleArchive}
          onDelete={onDeleteCountdown}
        />

        <BackupRestoreModal
          visible={isBackupModalOpen}
          palette={palette}
          stateForExport={state}
          onClose={() => setBackupModalOpen(false)}
          onImportState={nextState => {
            actions.importState(nextState);
            setActiveTab('dashboard');
          }}
        />

        <DotGridModal
          visible={Boolean(visualizeItem)}
          item={visualizeItem}
          now={now}
          palette={palette}
          onClose={() => setVisualizeId(null)}
        />

        <NotificationsSettingsModal
          visible={isNotificationsModalOpen}
          palette={palette}
          accentColor={accent}
          notificationsEnabled={notificationsEnabled}
          defaults={state.settings.notificationDefaults}
          onUpdateDefaults={next =>
            actions.updateSettings({
              notificationDefaults: next,
            })
          }
          onRequestNotifications={onRequestNotifications}
          onSendTestNotification={onSendTestNotification}
          onClose={() => setNotificationsModalOpen(false)}
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
  },
  screenArea: {
    flex: 1,
  },
});
