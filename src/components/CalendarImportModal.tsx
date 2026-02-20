import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ResolvedPalette } from '../domain/palette';
import {
  CalendarImportEvent,
  fetchUpcomingCalendarEvents,
  requestCalendarAccess,
} from '../lib/calendar';

interface CalendarImportModalProps {
  visible: boolean;
  palette: ResolvedPalette;
  onClose: () => void;
  onSelectEvent: (event: CalendarImportEvent) => void;
}

export function CalendarImportModal({
  visible,
  palette,
  onClose,
  onSelectEvent,
}: CalendarImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarImportEvent[]>([]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      const access = await requestCalendarAccess();

      if (!active) {
        return;
      }

      setHasAccess(access);
      if (!access) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const upcoming = await fetchUpcomingCalendarEvents();
      if (!active) {
        return;
      }

      setEvents(upcoming);
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: palette.pageBackground }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={[styles.headerAction, { color: palette.textSecondary }]}>Close</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Import from Calendar</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <View style={styles.centeredState}>
              <ActivityIndicator size="large" color={palette.textPrimary} />
              <Text style={[styles.stateLabel, { color: palette.textSecondary }]}>Loading events…</Text>
            </View>
          ) : null}

          {!loading && hasAccess === false ? (
            <View style={styles.centeredState}>
              <Text style={[styles.stateLabel, { color: palette.textSecondary }]}>
                Calendar access is required to import events.
              </Text>
            </View>
          ) : null}

          {!loading && hasAccess && events.length === 0 ? (
            <View style={styles.centeredState}>
              <Text style={[styles.stateLabel, { color: palette.textSecondary }]}>No upcoming events found.</Text>
            </View>
          ) : null}

          {!loading && hasAccess && events.length > 0 ? (
            <View style={styles.eventList}>
              {events.map(event => (
                <Pressable
                  key={event.id}
                  style={[
                    styles.eventRow,
                    {
                      backgroundColor: palette.floatingBackground,
                      borderColor: palette.border,
                    },
                  ]}
                  onPress={() => {
                    onSelectEvent(event);
                    onClose();
                  }}>
                  <Text style={[styles.eventTitle, { color: palette.textPrimary }]}>{event.title}</Text>
                  <Text style={[styles.eventDate, { color: palette.textSecondary }]}>
                    {format(new Date(event.startDate), 'EEE, MMM d · HH:mm')}
                  </Text>
                  {event.location ? (
                    <Text style={[styles.eventMeta, { color: palette.textSecondary }]}>📍 {event.location}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centeredState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateLabel: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
  eventList: {
    gap: 10,
  },
  eventRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  eventMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
});
