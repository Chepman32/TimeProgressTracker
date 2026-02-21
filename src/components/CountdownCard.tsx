import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CountdownItem, CountdownMetrics, ThemeTemplate } from '../domain/types';
import { formatFullDate, recurrenceLabel } from '../lib/date';
import { ProgressBar } from './ProgressBar';
import { ProgressRing } from './ProgressRing';

interface CountdownCardProps {
  item: CountdownItem;
  metrics: CountdownMetrics;
  theme: ThemeTemplate;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
  showPinButton?: boolean;
  onTogglePin: () => void;
}

export function CountdownCard({
  item,
  metrics,
  theme,
  index,
  onPress,
  onLongPress,
  showPinButton = true,
  onTogglePin,
}: CountdownCardProps) {
  const entrance = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      useNativeDriver: true,
      delay: Math.min(index * 55, 280),
      velocity: 1.8,
      tension: 130,
      friction: 14,
    }).start();
  }, [entrance, index]);

  const cardStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: entrance.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          }),
        },
        { scale: pressScale },
      ],
      opacity: entrance,
    }),
    [entrance, pressScale],
  );

  const onPressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.985,
      useNativeDriver: true,
      velocity: 2,
      tension: 160,
      friction: 17,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      velocity: 3,
      tension: 170,
      friction: 16,
    }).start();
  };

  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const accent = item.accentColor ?? theme.colors.accent;
  const pinSymbolStyle = { color: accent };

  const cardView = (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.cardBackground[0],
          borderRadius: theme.borderRadius,
          borderColor: theme.colors.track,
        },
        cardStyle,
      ]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.pressable}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.titleColumn}>
              <Text numberOfLines={1} style={[styles.title, { color: textPrimary }]}> 
                {item.title}
              </Text>
              <Text numberOfLines={1} style={[styles.subtitle, { color: textSecondary }]}>
                {metrics.secondaryLabel}
              </Text>
            </View>
          </View>
          {showPinButton ? (
            <TouchableOpacity
              style={[styles.pinButton, { borderColor: theme.colors.track }]}
              onPress={onTogglePin}>
              <Text style={[styles.pinSymbol, pinSymbolStyle]}>
                {item.pinned ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.progressSection}>
          {item.progressVisual === 'ring' ? (
            <View style={styles.ringRow}>
              <ProgressRing
                size={64}
                strokeWidth={8}
                progress={metrics.progress}
                trackColor={theme.colors.track}
                fillColor={accent}
              />
              <View style={styles.ringTextWrap}>
                <Text style={[styles.primaryValue, { color: textPrimary }]}>
                  {metrics.primaryLabel}
                </Text>
                <Text style={[styles.percentage, { color: textSecondary }]}>
                  {metrics.percentageLabel} completed
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.primaryValue, { color: textPrimary }]}> 
                {metrics.primaryLabel}
              </Text>
              {item.progressVisual !== 'empty' ? (
                <View style={styles.barWrap}>
                  <ProgressBar
                    progress={metrics.progress}
                    trackColor={theme.colors.track}
                    fillColor={accent}
                  />
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: textSecondary }]}>
            {formatFullDate(metrics.windowEnd)}
          </Text>
          <Text style={[styles.footerText, { color: textSecondary }]}>
            {recurrenceLabel(item.recurrence)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
  return cardView;
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  pressable: {
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  pinButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSymbol: {
    fontSize: 14,
  },
  progressSection: {
    gap: 10,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ringTextWrap: {
    flex: 1,
    gap: 6,
  },
  primaryValue: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  barWrap: {
    marginTop: 2,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
