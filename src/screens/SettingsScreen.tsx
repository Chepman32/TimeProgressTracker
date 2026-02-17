import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ResolvedPalette } from '../domain/palette';
import { AppSettings, AppearanceMode } from '../domain/types';
import { SegmentedControl } from '../components/SegmentedControl';
import { ToggleRow } from '../components/ToggleRow';

interface SettingsScreenProps {
  settings: AppSettings;
  palette: ResolvedPalette;
  accentColor: string;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onResetData: () => Promise<void>;
}

const APPEARANCE_OPTIONS: Array<{ label: string; value: AppearanceMode }> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export function SettingsScreen({
  settings,
  palette,
  accentColor,
  onUpdateSettings,
  onResetData,
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
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Data</Text>
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
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>PRO Scope</Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• 6 visual templates</Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• Recurrent events and streak counters</Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• Notification rule presets</Text>
        <Text style={[styles.proLine, { color: palette.textSecondary }]}>• iCloud/widget sync-ready data model</Text>
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
  resetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  proLine: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
