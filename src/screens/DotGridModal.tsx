import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CountdownItem } from '../domain/types';
import { calculateCountdownMetrics } from '../lib/date';
import { ResolvedPalette } from '../domain/palette';
import { getThemeById } from '../domain/themes';

const DOT_SIZE = 18;
const DOT_GAP = 6;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DOTS = 365;

interface DotGridModalProps {
  visible: boolean;
  item: CountdownItem | undefined;
  now: Date;
  palette: ResolvedPalette;
  onClose: () => void;
}

export function DotGridModal({ visible, item, now, palette, onClose }: DotGridModalProps) {
  const translateY = useRef(new Animated.Value(88)).current;
  const scale = useRef(new Animated.Value(0.93)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  const closeWithAnimation = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 120,
        useNativeDriver: true,
        velocity: 3.1,
        stiffness: 290,
        damping: 38,
        mass: 0.9,
      }),
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      isClosing.current = false;
      onClose();
    });
  }, [backdropOpacity, modalOpacity, onClose, scale, translateY]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(88);
      scale.setValue(0.93);
      modalOpacity.setValue(0);
      backdropOpacity.setValue(0);
      isClosing.current = false;
      return;
    }

    translateY.setValue(88);
    scale.setValue(0.93);
    modalOpacity.setValue(0);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        velocity: 4.2,
        stiffness: 340,
        damping: 28,
        mass: 0.9,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        velocity: 3.3,
        stiffness: 300,
        damping: 24,
        mass: 0.85,
      }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 190, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [backdropOpacity, modalOpacity, scale, translateY, visible]);

  if (!item) return null;

  const metrics = calculateCountdownMetrics(item, now);
  const totalDays = Math.min(Math.ceil(metrics.totalMs / DAY_MS), MAX_DOTS);
  const elapsedDays = Math.min(Math.floor(metrics.elapsedMs / DAY_MS), totalDays);
  const theme = getThemeById(item.themeId);
  const accent = item.accentColor ?? theme.colors.accent;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeWithAnimation}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeWithAnimation} />
      </Animated.View>

      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.pageBackground,
              opacity: modalOpacity,
              transform: [{ translateY }, { scale }],
            },
          ]}>
          <View style={[styles.swipeHandle, { backgroundColor: palette.textSecondary }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={1}>
              {item.icon} {item.title}
            </Text>
            <Pressable
              onPress={closeWithAnimation}
              style={[styles.closeBtn, { backgroundColor: palette.elevatedBackground }]}>
              <Text style={[styles.closeBtnText, { color: palette.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {elapsedDays} of {totalDays} days elapsed
          </Text>

          <DotGrid
            key={`${item.id}-${visible}`}
            totalDays={totalDays}
            elapsedDays={elapsedDays}
            accent={accent}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

interface DotGridProps {
  totalDays: number;
  elapsedDays: number;
  accent: string;
}

function DotGrid({ totalDays, elapsedDays, accent }: DotGridProps) {
  const dotAnims = useRef(
    Array.from({ length: totalDays }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = dotAnims.map((anim, i) =>
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        delay: Math.min(i * 7, 600),
        velocity: i < elapsedDays ? 3 : 1,
        tension: i < elapsedDays ? 160 : 90,
        friction: i < elapsedDays ? 10 : 14,
      }),
    );
    Animated.parallel(animations).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      {dotAnims.map((anim, i) => {
        const filled = i < elapsedDays;
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: filled ? accent : 'rgba(128,128,128,0.2)',
                transform: [{ scale: anim }],
                opacity: anim,
              },
            ]}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 26,
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
    minHeight: '58%',
    borderRadius: 34,
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.28,
    shadowRadius: 26,
    elevation: 30,
  },
  swipeHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DOT_GAP,
    paddingBottom: 12,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
