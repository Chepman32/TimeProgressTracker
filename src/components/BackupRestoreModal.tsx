import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppState } from '../domain/types';
import { ResolvedPalette } from '../domain/palette';
import { parseImportedState } from '../lib/storage';
import { SegmentedControl } from './SegmentedControl';

type Mode = 'export' | 'import';

interface BackupRestoreModalProps {
  visible: boolean;
  palette: ResolvedPalette;
  stateForExport: AppState;
  onClose: () => void;
  onImportState: (state: AppState) => void;
}

const MODE_OPTIONS: Array<{ label: string; value: Mode }> = [
  { label: 'Export', value: 'export' },
  { label: 'Import', value: 'import' },
];

export function BackupRestoreModal({
  visible,
  palette,
  stateForExport,
  onClose,
  onImportState,
}: BackupRestoreModalProps) {
  const [mode, setMode] = useState<Mode>('export');
  const [input, setInput] = useState('');

  const exportPayload = useMemo(() => {
    return JSON.stringify(stateForExport, null, 2);
  }, [stateForExport]);

  const onPressImport = () => {
    const parsed = parseImportedState(input);
    if (!parsed) {
      Alert.alert('Invalid backup', 'Backup payload could not be parsed.');
      return;
    }

    onImportState(parsed);
    Alert.alert('Backup restored', 'Your countdowns and settings were imported.');
    onClose();
    setInput('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: palette.pageBackground }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={[styles.headerAction, { color: palette.textSecondary }]}>Close</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Backup & Restore</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.modeWrap}>
          <SegmentedControl
            options={MODE_OPTIONS}
            selected={mode}
            onChange={setMode}
            backgroundColor={palette.floatingBackground}
            activeColor={palette.textPrimary}
            textColor={palette.textSecondary}
            activeTextColor={palette.isDark ? '#06060b' : '#ffffff'}
          />
        </View>

        {mode === 'export' ? (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.copyHint, { color: palette.textSecondary }]}>Copy this JSON backup and store it securely.</Text>
            <TextInput
              style={[
                styles.jsonView,
                {
                  color: palette.textPrimary,
                  backgroundColor: palette.floatingBackground,
                  borderColor: palette.border,
                },
              ]}
              multiline
              editable={false}
              value={exportPayload}
            />
          </ScrollView>
        ) : (
          <View style={styles.content}>
            <Text style={[styles.copyHint, { color: palette.textSecondary }]}>Paste a previously exported backup JSON.</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              multiline
              placeholder="Paste JSON backup"
              placeholderTextColor={palette.textTertiary}
              style={[
                styles.jsonView,
                {
                  color: palette.textPrimary,
                  backgroundColor: palette.floatingBackground,
                  borderColor: palette.border,
                },
              ]}
            />
            <Pressable
              onPress={onPressImport}
              style={[styles.importButton, { backgroundColor: palette.textPrimary }]}
            >
              <Text style={styles.importButtonText}>Restore backup</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
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
  modeWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  copyHint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  jsonView: {
    flex: 1,
    minHeight: 360,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Menlo',
  },
  importButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
