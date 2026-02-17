import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ResolvedPalette } from '../domain/palette';
import { CountdownItem } from '../domain/types';
import { getThemeById } from '../domain/themes';
import { calculateCountdownMetrics, formatDurationShort, getPeriodProgress } from '../lib/date';
import { CountdownCard } from '../components/CountdownCard';
import { SegmentedControl } from '../components/SegmentedControl';

interface DashboardScreenProps {
  countdowns: CountdownItem[];
  now: Date;
  weekStartsOnMonday: boolean;
  defaultShowArchived: boolean;
  palette: ResolvedPalette;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onTogglePin: (id: string) => void;
}

type FilterMode = 'active' | 'all' | 'archived';

const FILTER_OPTIONS: Array<{ value: FilterMode; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
  { value: 'archived', label: 'Archived' },
];

export function DashboardScreen({
  countdowns,
  now,
  weekStartsOnMonday,
  defaultShowArchived,
  palette,
  onCreate,
  onOpen,
  onTogglePin,
}: DashboardScreenProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>(
    defaultShowArchived ? 'all' : 'active',
  );
  const [query, setQuery] = useState('');

  const listItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return countdowns
      .filter(item => {
        if (filterMode === 'active' && item.archived) {
          return false;
        }

        if (filterMode === 'archived' && !item.archived) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return (
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.notes.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((first, second) => {
        if (first.pinned !== second.pinned) {
          return first.pinned ? -1 : 1;
        }

        const firstDate = new Date(first.targetDate).getTime();
        const secondDate = new Date(second.targetDate).getTime();

        return firstDate - secondDate;
      });
  }, [countdowns, filterMode, query]);

  const periodProgress = useMemo(() => {
    return [
      getPeriodProgress('day', now, weekStartsOnMonday),
      getPeriodProgress('week', now, weekStartsOnMonday),
      getPeriodProgress('month', now, weekStartsOnMonday),
      getPeriodProgress('year', now, weekStartsOnMonday),
    ];
  }, [now, weekStartsOnMonday]);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={listItems}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.headerStack}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.overline, { color: palette.textSecondary }]}>Pretty Progress</Text>
              <Text style={[styles.title, { color: palette.textPrimary }]}>Your Timers</Text>
            </View>
            <Pressable
              style={[styles.createButton, { backgroundColor: palette.textPrimary }]}
              onPress={onCreate}>
              <Text style={styles.createButtonText}>＋</Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="Search countdowns"
            placeholderTextColor={palette.textTertiary}
            style={[
              styles.search,
              {
                color: palette.textPrimary,
                borderColor: palette.border,
                backgroundColor: palette.floatingBackground,
              },
            ]}
            value={query}
            onChangeText={setQuery}
          />

          <SegmentedControl
            options={FILTER_OPTIONS}
            selected={filterMode}
            onChange={setFilterMode}
            backgroundColor={palette.floatingBackground}
            activeColor={palette.textPrimary}
            textColor={palette.textSecondary}
            activeTextColor={palette.isDark ? '#06060b' : '#ffffff'}
          />

          <View style={styles.metricsRow}>
            {periodProgress.map(progress => {
              const percentage = Math.round(progress.progress * 100);

              return (
                <View
                  key={progress.period}
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: palette.floatingBackground,
                      borderColor: palette.border,
                    },
                  ]}>
                  <Text style={[styles.metricLabel, { color: palette.textSecondary }]}>
                    {progress.label}
                  </Text>
                  <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                    {percentage}%
                  </Text>
                  <Text style={[styles.metricSub, { color: palette.textTertiary }]}>
                    {formatDurationShort(progress.remainingMs)} left
                  </Text>
                </View>
              );
            })}
          </View>

          {listItems.length === 0 ? (
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: palette.floatingBackground,
                  borderColor: palette.border,
                },
              ]}>
              <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No countdowns</Text>
              <Text style={[styles.emptySub, { color: palette.textSecondary }]}>
                Create a timer or add one from the library.
              </Text>
              <Pressable
                onPress={onCreate}
                style={[styles.emptyAction, { backgroundColor: palette.textPrimary }]}
              >
                <Text style={styles.emptyActionText}>Create countdown</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item, index }) => {
        const metrics = calculateCountdownMetrics(item, now);
        const theme = getThemeById(item.themeId);

        return (
          <CountdownCard
            item={item}
            metrics={metrics}
            theme={theme}
            index={index}
            onPress={() => onOpen(item.id)}
            onTogglePin={() => onTogglePin(item.id)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    paddingTop: 8,
  },
  headerStack: {
    gap: 14,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    gap: 2,
  },
  overline: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    letterSpacing: -0.6,
    fontWeight: '800',
  },
  createButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '600',
  },
  search: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    minWidth: '48%',
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metricSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 18,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  emptySub: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 4,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
