import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { differenceInCalendarDays, format } from 'date-fns';
import { ResolvedPalette } from '../domain/palette';
import { CountdownItem } from '../domain/types';
import { calculateCountdownMetrics, formatDurationShort } from '../lib/date';
import { getThemeById } from '../domain/themes';

interface TimelineScreenProps {
  countdowns: CountdownItem[];
  now: Date;
  palette: ResolvedPalette;
  onOpen: (id: string) => void;
}

export function TimelineScreen({
  countdowns,
  now,
  palette,
  onOpen,
}: TimelineScreenProps) {
  const upcoming = useMemo(() => {
    return countdowns
      .filter(item => !item.archived && !item.trashedAt)
      .map(item => {
        const metrics = calculateCountdownMetrics(item, now);
        return {
          item,
          metrics,
          when: metrics.windowEnd,
        };
      })
      .sort((first, second) => first.when.getTime() - second.when.getTime());
  }, [countdowns, now]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>Upcoming Timeline</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        See every upcoming goal in chronological order and stay ahead.
      </Text>

      <View style={styles.stack}>
        {upcoming.map(({ item, metrics }) => {
          const theme = getThemeById(item.themeId);
          const dayDiff = differenceInCalendarDays(metrics.windowEnd, now);
          const dayLabel =
            dayDiff > 0
              ? `${dayDiff} days left`
              : dayDiff === 0
                ? 'Today'
                : `${Math.abs(dayDiff)} days ago`;

          return (
            <Pressable
              key={item.id}
              style={[
                styles.entry,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.floatingBackground,
                },
              ]}
              onPress={() => onOpen(item.id)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: item.accentColor ?? theme.colors.accent,
                  },
                ]}
              />
              <View style={styles.entryBody}>
                <View style={styles.entryTop}>
                  <Text style={[styles.entryTitle, { color: palette.textPrimary }]}>
                    {item.icon} {item.title}
                  </Text>
                  <Text style={[styles.entryDate, { color: palette.textSecondary }]}>
                    {format(metrics.windowEnd, 'MMM d')}
                  </Text>
                </View>
                <Text style={[styles.entrySub, { color: palette.textSecondary }]}>
                  {dayLabel} · {formatDurationShort(metrics.displayDurationMs)} · {metrics.percentageLabel}
                </Text>
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
    gap: 8,
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
    marginBottom: 8,
  },
  stack: {
    gap: 10,
  },
  entry: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  entryBody: {
    flex: 1,
    gap: 3,
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  entryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  entryDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  entrySub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
