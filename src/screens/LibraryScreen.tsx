import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COUNTDOWN_PRESETS } from '../domain/presets';
import { ResolvedPalette } from '../domain/palette';
import { CountdownPreset } from '../domain/types';
import { getThemeById } from '../domain/themes';

interface LibraryScreenProps {
  palette: ResolvedPalette;
  onUsePreset: (preset: CountdownPreset) => void;
}

export function LibraryScreen({
  palette,
  onUsePreset,
}: LibraryScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headingWrap}>
        <Text style={[styles.heading, { color: palette.textPrimary }]}>Inspiration Library</Text>
        <Text style={[styles.subheading, { color: palette.textSecondary }]}>
          Start faster with presets for fasting, sobriety, travel, milestones, and recurring routines.
        </Text>
      </View>

      <View style={styles.grid}>
        {COUNTDOWN_PRESETS.map(preset => {
          const theme = getThemeById(preset.themeId);
          return (
            <Pressable
              key={preset.id}
              style={[
                styles.presetCard,
                {
                  backgroundColor: theme.colors.cardBackground[0],
                  borderColor: theme.colors.track,
                  borderRadius: theme.borderRadius,
                },
              ]}
              onPress={() => onUsePreset(preset)}>
              <View style={styles.presetTopRow}>
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text
                  style={[
                    styles.presetBadge,
                    {
                      color: theme.colors.textSecondary,
                      borderColor: theme.colors.track,
                    },
                  ]}>
                  {preset.recurrence === 'none' ? 'One-time' : preset.recurrence}
                </Text>
              </View>
              <Text style={[styles.presetTitle, { color: theme.colors.textPrimary }]}>
                {preset.title}
              </Text>
              <Text style={[styles.presetDescription, { color: theme.colors.textSecondary }]}>
                {preset.description}
              </Text>
              <View
                style={[
                  styles.useButton,
                  {
                    backgroundColor: theme.colors.accent,
                  },
                ]}>
                <Text style={styles.useButtonText}>Use template</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    paddingTop: 10,
    gap: 16,
  },
  headingWrap: {
    gap: 8,
  },
  heading: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.7,
    fontWeight: '800',
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  grid: {
    gap: 12,
  },
  presetCard: {
    borderWidth: 1,
    padding: 15,
    gap: 10,
  },
  presetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetIcon: {
    fontSize: 24,
  },
  presetBadge: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 8,
  },
  presetTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  presetDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  useButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  useButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
