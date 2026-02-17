import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ResolvedPalette } from '../domain/palette';
import { CountdownItem } from '../domain/types';
import {
  calculateCountdownMetrics,
  formatDurationShort,
  formatFullDate,
  formatTime,
  recurrenceLabel,
} from '../lib/date';
import { getThemeById } from '../domain/themes';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressRing } from '../components/ProgressRing';

interface CountdownDetailModalProps {
  visible: boolean;
  item?: CountdownItem;
  now: Date;
  palette: ResolvedPalette;
  onClose: () => void;
  onEdit: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CountdownDetailModal({
  visible,
  item,
  now,
  palette,
  onClose,
  onEdit,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: CountdownDetailModalProps) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.9);
      opacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        velocity: 2,
        tension: 130,
        friction: 15,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  if (!item) {
    return null;
  }

  const theme = getThemeById(item.themeId);
  const metrics = calculateCountdownMetrics(item, now);
  const accent = item.accentColor ?? theme.colors.accent;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.pageBackground,
              borderColor: palette.border,
              opacity,
              transform: [{ scale }],
            },
          ]}>
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Text style={[styles.headerAction, { color: palette.textSecondary }]}>Close</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{item.title}</Text>
            <Pressable onPress={() => onEdit(item.id)}>
              <Text style={[styles.headerAction, { color: palette.textPrimary }]}>Edit</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View
              style={[
                styles.hero,
                {
                  backgroundColor: theme.colors.cardBackground[0],
                  borderColor: theme.colors.track,
                },
              ]}>
              <Text style={styles.heroIcon}>{item.icon}</Text>
              <ProgressRing
                size={138}
                strokeWidth={12}
                progress={metrics.progress}
                trackColor={theme.colors.track}
                fillColor={accent}
              />
              <Text style={[styles.heroValue, { color: theme.colors.textPrimary }]}>
                {metrics.primaryLabel}
              </Text>
              <Text style={[styles.heroLabel, { color: theme.colors.textSecondary }]}>
                {metrics.secondaryLabel} · {metrics.percentageLabel}
              </Text>

              <View style={styles.heroBar}>
                <ProgressBar
                  progress={metrics.progress}
                  trackColor={theme.colors.track}
                  fillColor={accent}
                  height={10}
                />
              </View>
            </View>

            <View
              style={[
                styles.panel,
                { backgroundColor: palette.floatingBackground, borderColor: palette.border },
              ]}>
              <Text style={[styles.panelTitle, { color: palette.textPrimary }]}>Schedule</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Start: {formatFullDate(metrics.windowStart)} · {formatTime(metrics.windowStart)}</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Target: {formatFullDate(metrics.windowEnd)} · {formatTime(metrics.windowEnd)}</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>{recurrenceLabel(item.recurrence)}</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Mode: {item.mode === 'countdown' ? 'Count down' : 'Count up'}</Text>
            </View>

            <View
              style={[
                styles.panel,
                { backgroundColor: palette.floatingBackground, borderColor: palette.border },
              ]}>
              <Text style={[styles.panelTitle, { color: palette.textPrimary }]}>Insights</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Elapsed: {formatDurationShort(metrics.elapsedMs, 3)}</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Remaining: {formatDurationShort(metrics.remainingMs, 3)}</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Total window: {formatDurationShort(metrics.totalMs, 3)}</Text>
              {item.notes ? (
                <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Notes: {item.notes}</Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: palette.elevatedBackground, borderColor: palette.border }]}
                onPress={() => onTogglePin(item.id)}>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>{item.pinned ? 'Unpin' : 'Pin'}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: palette.elevatedBackground, borderColor: palette.border }]}
                onPress={() => onToggleArchive(item.id)}>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>{item.archived ? 'Unarchive' : 'Archive'}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.transparentActionButton,
                  { borderColor: palette.destructive },
                ]}
                onPress={() => onDelete(item.id)}>
                <Text style={[styles.actionText, { color: palette.destructive }]}>Delete</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 14, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '100%',
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerAction: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 18,
    gap: 12,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    fontSize: 28,
  },
  heroValue: {
    fontSize: 36,
    letterSpacing: -0.7,
    fontWeight: '800',
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroBar: {
    width: '84%',
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  panelLine: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  transparentActionButton: {
    backgroundColor: 'transparent',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
