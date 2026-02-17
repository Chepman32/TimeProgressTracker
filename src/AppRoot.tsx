import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from './components/AppBackground';
import { BottomTabBar } from './components/BottomTabBar';
import { resolvePalette } from './domain/palette';
import { AppTab, CountdownItem } from './domain/types';
import { getThemeById } from './domain/themes';
import {
  useCountdownById,
  useCountdownStore,
  useDebouncedNow,
  useSortedCountdowns,
} from './hooks/useCountdownStore';
import { DashboardScreen } from './screens/DashboardScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { CountdownEditorModal } from './screens/CountdownEditorModal';
import { CountdownDetailModal } from './screens/CountdownDetailModal';

export function AppRoot() {
  const { isReady, state, actions } = useCountdownStore();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme() === 'dark';
  const now = useDebouncedNow(1000);

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);

  const sortedCountdowns = useSortedCountdowns(state.countdowns);
  const detailItem = useCountdownById(sortedCountdowns, detailId);
  const editingItem = useCountdownById(sortedCountdowns, editorId);

  const palette = useMemo(
    () => resolvePalette(state.settings.appearance, systemColorScheme),
    [state.settings.appearance, systemColorScheme],
  );

  const baseTheme = getThemeById(sortedCountdowns[0]?.themeId ?? 'swiss');
  const accent = baseTheme.colors.accent;

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.pageBackground }]}> 
        <Text style={[styles.loadingText, { color: palette.textPrimary }]}>Preparing Pretty Progress…</Text>
      </View>
    );
  }

  const openCreateModal = () => {
    setEditorId(null);
    setEditorOpen(true);
  };

  const openEditModal = (id: string) => {
    setDetailId(null);
    setEditorId(id);
    setEditorOpen(true);
  };

  const onSaveCountdown = (item: CountdownItem) => {
    const exists = sortedCountdowns.some(countdown => countdown.id === item.id);

    if (exists) {
      actions.updateCountdown(item);
      return;
    }

    actions.addCountdown(item);
  };

  const onDeleteCountdown = (id: string) => {
    Alert.alert('Delete countdown?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          actions.removeCountdown(id);
          setDetailId(null);
        },
      },
    ]);
  };

  return (
    <AppBackground colors={baseTheme.colors.appBackground} isDark={palette.isDark}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {!state.onboardingCompleted ? (
          <OnboardingScreen palette={palette} onFinish={actions.completeOnboarding} />
        ) : (
          <>
            <View style={styles.screenArea}>
              {activeTab === 'dashboard' ? (
                <DashboardScreen
                  countdowns={sortedCountdowns}
                  now={now}
                  weekStartsOnMonday={state.settings.weekStartsOnMonday}
                  defaultShowArchived={state.settings.showArchivedByDefault}
                  palette={palette}
                  onCreate={openCreateModal}
                  onOpen={setDetailId}
                  onTogglePin={actions.togglePin}
                />
              ) : null}

              {activeTab === 'library' ? (
                <LibraryScreen
                  palette={palette}
                  onUsePreset={preset => {
                    const created = actions.addFromPreset(preset);
                    setActiveTab('dashboard');
                    setDetailId(created.id);
                  }}
                />
              ) : null}

              {activeTab === 'timeline' ? (
                <TimelineScreen
                  countdowns={sortedCountdowns}
                  now={now}
                  palette={palette}
                  onOpen={setDetailId}
                />
              ) : null}

              {activeTab === 'settings' ? (
                <SettingsScreen
                  settings={state.settings}
                  palette={palette}
                  accentColor={accent}
                  onUpdateSettings={actions.updateSettings}
                  onResetData={actions.resetState}
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
        )}

        <CountdownEditorModal
          visible={isEditorOpen}
          palette={palette}
          countdown={editingItem}
          onClose={() => {
            setEditorOpen(false);
            setEditorId(null);
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
