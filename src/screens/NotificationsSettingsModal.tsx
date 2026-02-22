import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResolvedPalette } from '../domain/palette';
import { NotificationSettings } from '../domain/types';
import { ToggleRow } from '../components/ToggleRow';

interface NotificationsSettingsModalProps {
  visible: boolean;
  palette: ResolvedPalette;
  accentColor: string;
  notificationsEnabled: boolean;
  defaults: NotificationSettings;
  onUpdateDefaults: (next: NotificationSettings) => void;
  onRequestNotifications: () => void;
  onSendTestNotification: () => void;
  onClose: () => void;
}

export function NotificationsSettingsModal({
  visible,
  palette,
  accentColor,
  notificationsEnabled,
  defaults,
  onUpdateDefaults,
  onRequestNotifications,
  onSendTestNotification,
  onClose,
}: NotificationsSettingsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      allowSwipeDismissal
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.pageBackground }]}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: palette.floatingBackground }]}>
            <Text style={[styles.closeText, { color: palette.textPrimary }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: palette.textPrimary }]}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.section,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              Events with target date
            </Text>
            <ToggleRow
              label="Event reached"
              value={defaults.atEnd}
              onChange={value => onUpdateDefaults({ ...defaults, atEnd: value })}
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={accentColor}
            />
            <View style={[styles.separator, { backgroundColor: palette.separator }]} />
            <ToggleRow
              label="1 day before"
              value={defaults.dayBefore}
              onChange={value => onUpdateDefaults({ ...defaults, dayBefore: value })}
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={accentColor}
            />
            <View style={[styles.separator, { backgroundColor: palette.separator }]} />
            <ToggleRow
              label="1 week before"
              value={defaults.weekBefore}
              onChange={value => onUpdateDefaults({ ...defaults, weekBefore: value })}
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={accentColor}
            />
            <Text style={[styles.helper, { color: palette.textSecondary }]}>
              Applied as default rules when creating new timers.
            </Text>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
              Count-up events
            </Text>
            <ToggleRow
              label="Recurring milestones"
              value={defaults.repeatingMilestones}
              onChange={value => onUpdateDefaults({ ...defaults, repeatingMilestones: value })}
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={accentColor}
            />
            <Text style={[styles.helper, { color: palette.textSecondary }]}>
              Enables repeating milestone notifications for streak-style timers.
            </Text>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Pressable
              onPress={onRequestNotifications}
              style={[styles.actionButton, { borderColor: palette.border }]}>
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>
                {notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              </Text>
            </Pressable>
            <Pressable
              onPress={onSendTestNotification}
              style={[styles.actionButton, { borderColor: palette.border }]}>
              <Text style={[styles.actionText, { color: palette.textPrimary }]}>
                Send test notification
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 30,
    lineHeight: 32,
    marginTop: -2,
    fontWeight: '400',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    gap: 14,
  },
  section: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    opacity: 0.65,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 11,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
