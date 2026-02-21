import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Modal,
  Pressable,
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
  const translateY = useRef(new Animated.Value(28)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  const closeWithAnimation = useCallback(() => {
    if (isClosing.current) {
      return;
    }

    isClosing.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 420,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosing.current = false;
      onClose();
    });
  }, [backdropOpacity, onClose, translateY]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(28);
      backdropOpacity.setValue(0);
      isClosing.current = false;
      return;
    }

    translateY.setValue(28);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        velocity: 1.6,
        tension: 120,
        friction: 14,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, translateY, visible]);

  const closeWithAnimationRef = useRef(closeWithAnimation);
  useEffect(() => {
    closeWithAnimationRef.current = closeWithAnimation;
  }, [closeWithAnimation]);

  // Raw gesture state — tracks a single active touch
  const gesture = useRef({ startY: 0, lastY: 0, lastTime: 0, vy: 0 });

  const swipeHandlers = useRef({
    onStartShouldSetResponder: () => true,
    onResponderGrant: (e: GestureResponderEvent) => {
      const y = e.nativeEvent.pageY;
      gesture.current = { startY: y, lastY: y, lastTime: Date.now(), vy: 0 };
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const now = Date.now();
      const y = e.nativeEvent.pageY;
      const dy = y - gesture.current.startY;
      const dt = now - gesture.current.lastTime;
      if (dt > 0) {
        gesture.current.vy = (y - gesture.current.lastY) / dt;
      }
      gesture.current.lastY = y;
      gesture.current.lastTime = now;
      if (dy > 0) {
        translateY.setValue(dy);
      }
    },
    onResponderRelease: () => {
      const dy = gesture.current.lastY - gesture.current.startY;
      const vy = gesture.current.vy;
      if (dy > 70 || vy > 0.5) {
        closeWithAnimationRef.current();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          velocity: 1.4,
          tension: 140,
          friction: 16,
        }).start();
      }
    },
    onResponderTerminate: () => {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 140,
        friction: 16,
      }).start();
    },
  }).current;

  if (!item) {
    return null;
  }

  const theme = getThemeById(item.themeId);
  const metrics = calculateCountdownMetrics(item, now);
  const accent = item.accentColor ?? theme.colors.accent;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={closeWithAnimation}>
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeWithAnimation} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.pageBackground,
              borderColor: palette.border,
              transform: [{ translateY }],
            },
          ]}>
          <View style={styles.swipeArea} {...swipeHandlers}>
            <View style={[styles.swipeIndicator, { backgroundColor: palette.textSecondary }]} />
          </View>

          <View style={styles.header}>
            <Pressable onPress={closeWithAnimation}>
              <Text style={[styles.headerAction, { color: palette.textSecondary }]}>Close</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{item.title}</Text>
            <Pressable onPress={() => onEdit(item.id)}>
              <Text style={[styles.headerAction, { color: palette.textPrimary }]}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.hero,
                {
                  backgroundColor: theme.colors.cardBackground[0],
                  borderColor: theme.colors.track,
                },
              ]}
              {...swipeHandlers}>
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
              ]}
              {...swipeHandlers}>
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
              ]}
              {...swipeHandlers}>
              <Text style={[styles.panelTitle, { color: palette.textPrimary }]}>Insights</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Elapsed: {formatDurationShort(metrics.elapsedMs, 3)}</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Remaining: {formatDurationShort(metrics.remainingMs, 3)}</Text>
              <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Total window: {formatDurationShort(metrics.totalMs, 3)}</Text>
              {item.notes ? (
                <Text style={[styles.panelLine, { color: palette.textSecondary }]}>Notes: {item.notes}</Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              {!item.trashedAt ? (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: palette.elevatedBackground, borderColor: palette.border }]}
                  onPress={() => onTogglePin(item.id)}>
                  <Text style={[styles.actionText, { color: palette.textPrimary }]}>{item.pinned ? 'Unpin' : 'Pin'}</Text>
                </Pressable>
              ) : null}
              {!item.trashedAt ? (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: palette.elevatedBackground, borderColor: palette.border }]}
                  onPress={() => onToggleArchive(item.id)}>
                  <Text style={[styles.actionText, { color: palette.textPrimary }]}>{item.archived ? 'Unarchive' : 'Archive'}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[
                  styles.actionButton,
                  styles.transparentActionButton,
                  { borderColor: palette.destructive },
                ]}
                onPress={() => onDelete(item.id)}>
                <Text style={[styles.actionText, { color: palette.destructive }]}>
                  {item.trashedAt ? 'Remove permanently' : 'Move to Trash'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 14, 0.42)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 56,
    paddingBottom: 12,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '100%',
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
  },
  swipeArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 28,
  },
  swipeIndicator: {
    width: 42,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
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
