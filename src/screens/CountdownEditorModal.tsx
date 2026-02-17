import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { addDays } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ResolvedPalette } from '../domain/palette';
import { createBlankCountdown } from '../domain/factories';
import {
  CountdownItem,
  CounterMode,
  ProgressVisual,
  Recurrence,
  ThemeId,
} from '../domain/types';
import { THEME_TEMPLATES } from '../domain/themes';
import { formatFullDate, formatTime } from '../lib/date';
import { SegmentedControl } from '../components/SegmentedControl';
import { ToggleRow } from '../components/ToggleRow';

interface CountdownEditorModalProps {
  visible: boolean;
  palette: ResolvedPalette;
  countdown?: CountdownItem;
  onClose: () => void;
  onSave: (item: CountdownItem) => void;
}

type DateField = 'startDate' | 'targetDate';

const MODE_OPTIONS: Array<{ label: string; value: CounterMode }> = [
  { label: 'Count down', value: 'countdown' },
  { label: 'Count up', value: 'countup' },
];

const RECURRENCE_OPTIONS: Array<{ label: string; value: Recurrence }> = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const VISUAL_OPTIONS: Array<{ label: string; value: ProgressVisual }> = [
  { label: 'Bar', value: 'bar' },
  { label: 'Ring', value: 'ring' },
  { label: 'Empty', value: 'empty' },
];

export function CountdownEditorModal({
  visible,
  palette,
  countdown,
  onClose,
  onSave,
}: CountdownEditorModalProps) {
  const [draft, setDraft] = useState<CountdownItem>(() =>
    countdown ? { ...countdown } : createBlankCountdown(),
  );
  const [pickerField, setPickerField] = useState<DateField | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(countdown ? { ...countdown } : createBlankCountdown());
    setPickerField(null);
  }, [countdown, visible]);

  const activeDateValue = useMemo(() => {
    if (!pickerField) {
      return new Date();
    }

    return new Date(draft[pickerField]);
  }, [draft, pickerField]);

  const setTheme = (themeId: ThemeId) => {
    setDraft(current => ({ ...current, themeId }));
  };

  const updateDate = (field: DateField, value: Date) => {
    setDraft(current => {
      const updated = {
        ...current,
        [field]: value.toISOString(),
      };

      const start = new Date(updated.startDate);
      const target = new Date(updated.targetDate);

      if (target.getTime() <= start.getTime()) {
        updated.targetDate = addDays(start, 1).toISOString();
      }

      return updated;
    });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!pickerField) {
      return;
    }

    if (Platform.OS === 'android') {
      setPickerField(null);
    }

    if (!selectedDate || event.type === 'dismissed') {
      return;
    }

    updateDate(pickerField, selectedDate);
  };

  const onPressSave = () => {
    const now = new Date().toISOString();

    const nextTitle = draft.title.trim();
    const normalizedTitle = nextTitle.length > 0 ? nextTitle : 'Untitled countdown';

    onSave({
      ...draft,
      title: normalizedTitle,
      updatedAt: now,
      createdAt: draft.createdAt || now,
      notes: draft.notes.trim(),
      icon: draft.icon.trim() || '⏳',
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: palette.pageBackground }]}> 
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={[styles.headerAction, { color: palette.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Customize</Text>
          <Pressable onPress={onPressSave}>
            <Text style={[styles.headerAction, { color: palette.textPrimary }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={[
              styles.section,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Basics</Text>
            <View style={styles.inlineFields}>
              <View style={styles.iconInputWrap}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Icon</Text>
                <TextInput
                  value={draft.icon}
                  onChangeText={value => setDraft(current => ({ ...current, icon: value }))}
                  style={[
                    styles.input,
                    styles.iconInput,
                    {
                      color: palette.textPrimary,
                      backgroundColor: palette.elevatedBackground,
                      borderColor: palette.border,
                    },
                  ]}
                  maxLength={3}
                />
              </View>
              <View style={styles.titleInputWrap}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Title</Text>
                <TextInput
                  value={draft.title}
                  onChangeText={value => setDraft(current => ({ ...current, title: value }))}
                  placeholder="Countdown name"
                  placeholderTextColor={palette.textTertiary}
                  style={[
                    styles.input,
                    {
                      color: palette.textPrimary,
                      backgroundColor: palette.elevatedBackground,
                      borderColor: palette.border,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Mode</Text>
            <SegmentedControl
              options={MODE_OPTIONS}
              selected={draft.mode}
              onChange={value => setDraft(current => ({ ...current, mode: value }))}
              backgroundColor={palette.elevatedBackground}
              activeColor={palette.textPrimary}
              textColor={palette.textSecondary}
              activeTextColor={palette.isDark ? '#06060b' : '#ffffff'}
            />
            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Notes</Text>
            <TextInput
              value={draft.notes}
              onChangeText={value => setDraft(current => ({ ...current, notes: value }))}
              placeholder="Optional"
              placeholderTextColor={palette.textTertiary}
              multiline
              style={[
                styles.input,
                styles.notes,
                {
                  color: palette.textPrimary,
                  backgroundColor: palette.elevatedBackground,
                  borderColor: palette.border,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Dates & recurrence</Text>
            <Pressable
              onPress={() => setPickerField('startDate')}
              style={[
                styles.pill,
                { backgroundColor: palette.elevatedBackground, borderColor: palette.border },
              ]}>
              <Text style={[styles.pillLabel, { color: palette.textSecondary }]}>Start</Text>
              <Text style={[styles.pillValue, { color: palette.textPrimary }]}>
                {formatFullDate(draft.startDate)} · {formatTime(draft.startDate)}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPickerField('targetDate')}
              style={[
                styles.pill,
                { backgroundColor: palette.elevatedBackground, borderColor: palette.border },
              ]}>
              <Text style={[styles.pillLabel, { color: palette.textSecondary }]}>Target</Text>
              <Text style={[styles.pillValue, { color: palette.textPrimary }]}>
                {formatFullDate(draft.targetDate)} · {formatTime(draft.targetDate)}
              </Text>
            </Pressable>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Repeat</Text>
            <SegmentedControl
              options={RECURRENCE_OPTIONS}
              selected={draft.recurrence}
              onChange={value => setDraft(current => ({ ...current, recurrence: value }))}
              backgroundColor={palette.elevatedBackground}
              activeColor={palette.textPrimary}
              textColor={palette.textSecondary}
              activeTextColor={palette.isDark ? '#06060b' : '#ffffff'}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Design system</Text>
            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Template</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeList}>
              {THEME_TEMPLATES.map(theme => {
                const isSelected = draft.themeId === theme.id;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setTheme(theme.id)}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: theme.colors.cardBackground[0],
                        borderColor: isSelected ? theme.colors.accent : theme.colors.track,
                      },
                    ]}>
                    <Text style={styles.themeIcon}>◍</Text>
                    <Text style={[styles.themeName, { color: theme.colors.textPrimary }]}>
                      {theme.name}
                    </Text>
                    <Text style={[styles.themeDescription, { color: theme.colors.textSecondary }]}>
                      {theme.description}
                    </Text>
                    {theme.isPro ? (
                      <Text style={[styles.proTag, { color: theme.colors.accent }]}>PRO</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Progress style</Text>
            <SegmentedControl
              options={VISUAL_OPTIONS}
              selected={draft.progressVisual}
              onChange={value =>
                setDraft(current => ({
                  ...current,
                  progressVisual: value,
                }))
              }
              backgroundColor={palette.elevatedBackground}
              activeColor={palette.textPrimary}
              textColor={palette.textSecondary}
              activeTextColor={palette.isDark ? '#06060b' : '#ffffff'}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: palette.floatingBackground, borderColor: palette.border },
            ]}>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Notifications</Text>
            <ToggleRow
              label="1 week before"
              value={draft.notifications.weekBefore}
              onChange={value =>
                setDraft(current => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    weekBefore: value,
                  },
                }))
              }
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={palette.textPrimary}
            />
            <View style={[styles.separator, { backgroundColor: palette.separator }]} />
            <ToggleRow
              label="1 day before"
              value={draft.notifications.dayBefore}
              onChange={value =>
                setDraft(current => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    dayBefore: value,
                  },
                }))
              }
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={palette.textPrimary}
            />
            <View style={[styles.separator, { backgroundColor: palette.separator }]} />
            <ToggleRow
              label="At countdown end"
              value={draft.notifications.atEnd}
              onChange={value =>
                setDraft(current => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    atEnd: value,
                  },
                }))
              }
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={palette.textPrimary}
            />
            <View style={[styles.separator, { backgroundColor: palette.separator }]} />
            <ToggleRow
              label="Recurring milestones"
              subtitle="For repeating habits and streaks."
              value={draft.notifications.repeatingMilestones}
              onChange={value =>
                setDraft(current => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    repeatingMilestones: value,
                  },
                }))
              }
              textColor={palette.textPrimary}
              secondaryTextColor={palette.textSecondary}
              accentColor={palette.textPrimary}
            />
          </View>
        </ScrollView>

        {pickerField ? (
          <View
            style={[
              styles.datePickerWrap,
              {
                backgroundColor: palette.elevatedBackground,
                borderColor: palette.border,
              },
            ]}>
            <DateTimePicker
              value={activeDateValue}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              textColor={palette.textPrimary}
            />
            {Platform.OS === 'ios' ? (
              <Pressable
                onPress={() => setPickerField(null)}
                style={[styles.doneButton, { backgroundColor: palette.textPrimary }]}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerAction: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  iconInputWrap: {
    width: 84,
    gap: 5,
  },
  titleInputWrap: {
    flex: 1,
    gap: 5,
  },
  inputLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  iconInput: {
    textAlign: 'center',
    fontSize: 26,
  },
  notes: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  pill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 2,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pillValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeList: {
    gap: 8,
    paddingBottom: 3,
  },
  themeCard: {
    width: 154,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 5,
  },
  themeIcon: {
    fontSize: 18,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeDescription: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  proTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
  },
  datePickerWrap: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 6,
    alignItems: 'center',
    paddingBottom: 12,
  },
  doneButton: {
    marginTop: 4,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
