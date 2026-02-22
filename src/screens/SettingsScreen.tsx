import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ResolvedPalette } from '../domain/palette';
import { AppSettings, AppearanceMode } from '../domain/types';
import { SegmentedControl } from '../components/SegmentedControl';
import { ToggleRow } from '../components/ToggleRow';

interface SettingsScreenProps {
  settings: AppSettings;
  proUnlocked: boolean;
  notificationsEnabled: boolean;
  hasTrash: boolean;
  palette: ResolvedPalette;
  accentColor: string;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onResetData: () => Promise<void>;
  onCleanTrash: () => void;
  onOpenBackup: () => void;
  onOpenPro: () => void;
  onOpenNotifications: () => void;
  onRequestNotifications: () => void;
  onSendTestNotification: () => void;
}

const APPEARANCE_OPTIONS: Array<{ label: string; value: AppearanceMode }> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export function SettingsScreen({
  settings,
  proUnlocked,
  notificationsEnabled,
  hasTrash,
  palette,
  accentColor,
  onUpdateSettings,
  onResetData,
  onCleanTrash,
  onOpenBackup,
  onOpenPro,
  onOpenNotifications,
  onRequestNotifications,
  onSendTestNotification,
}: SettingsScreenProps) {
  const onPressReset = () => {
    Alert.alert('Reset all data?', 'This will restore demo countdowns and settings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          onResetData().catch(() => {});
        },
      },
    ]);
  };

  const onPressCleanTrash = () => {
    if (!hasTrash) {
      Alert.alert('Trash is empty');
      return;
    }

    Alert.alert('Clean Trash?', 'All projects in Trash will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clean',
        style: 'destructive',
        onPress: onCleanTrash,
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Adjust appearance and defaults for your countdown workflow.</Text>

      <View
        style={[
          styles.section,
          {
            backgroundColor: palette.floatingBackground,
            borderColor: palette.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Appearance</Text>
        <SegmentedControl
          options={APPEARANCE_OPTIONS}
          selected={settings.appearance}
          onChange={value => onUpdateSettings({ appearance: value })}
          backgroundColor={palette.elevatedBackground}
          activeColor={accentColor}
          textColor={palette.textSecondary}
          activeTextColor="#ffffff"
        />
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: palette.floatingBackground,
            borderColor: palette.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Behavior</Text>
        <ToggleRow
          label="Week starts on Monday"
          subtitle="Used in weekly progress calculations."
          value={settings.weekStartsOnMonday}
          onChange={value => onUpdateSettings({ weekStartsOnMonday: value })}
          textColor={palette.textPrimary}
          secondaryTextColor={palette.textSecondary}
          accentColor={accentColor}
        />
        <View style={[styles.separator, { backgroundColor: palette.separator }]} />
        <ToggleRow
          label="Show archived by default"
          subtitle="Dashboard opens with archived items visible."
          value={settings.showArchivedByDefault}
          onChange={value => onUpdateSettings({ showArchivedByDefault: value })}
          textColor={palette.textPrimary}
          secondaryTextColor={palette.textSecondary}
          accentColor={accentColor}
        />
        <View style={[styles.separator, { backgroundColor: palette.separator }]} />
        <ToggleRow
          label="Haptics"
          subtitle="Enable tactile feedback on interactions."
          value={settings.haptics}
          onChange={value => onUpdateSettings({ haptics: value })}
          textColor={palette.textPrimary}
          secondaryTextColor={palette.textSecondary}
          accentColor={accentColor}
        />
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: palette.floatingBackground,
            borderColor: palette.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Notifications</Text>
        <Pressable
          onPress={onOpenNotifications}
          style={[styles.secondaryButton, { borderColor: palette.border }]}>
          <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
            Open notifications settings
          </Text>
        </Pressable>
        <Pressable
          onPress={onRequestNotifications}
          style={[styles.secondaryButton, { borderColor: palette.border }]}>
          <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
            {notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onSendTestNotification}
          style={[styles.secondaryButton, { borderColor: palette.border }]}>
          <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
            Send test notification
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: palette.floatingBackground,
            borderColor: palette.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Data</Text>
        <Pressable
          style={[styles.secondaryButton, { borderColor: palette.border }]}
          onPress={onOpenBackup}>
          <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
            Backup / Restore JSON
          </Text>
        </Pressable>
        <Pressable
          style={[styles.resetButton, { borderColor: palette.destructive }]}
          onPress={onPressCleanTrash}>
          <Text style={[styles.resetText, { color: palette.destructive }]}>Clean Trash</Text>
        </Pressable>
        <Pressable
          style={[styles.resetButton, { borderColor: palette.destructive }]}
          onPress={onPressReset}>
          <Text style={[styles.resetText, { color: palette.destructive }]}>Reset demo data</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: palette.floatingBackground,
            borderColor: palette.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>PRO</Text>
        <Text style={[styles.proLine, { color: palette.textPrimary }]}>
          Status: {proUnlocked ? 'Unlocked' : 'Free'}
        </Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• 6 visual templates</Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• Recurrent events and streak counters</Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• Notification rule presets</Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• iCloud/widget sync-ready data model</Text>
        {!proUnlocked ? (
          <Pressable
            style={[styles.unlockButton, { backgroundColor: accentColor }]}
            onPress={onOpenPro}>
            <Text style={styles.unlockButtonText}>Unlock PRO</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    paddingTop: 10,
    gap: 12,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    opacity: 0.75,
  },
  resetButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  proLine: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  unlockButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
