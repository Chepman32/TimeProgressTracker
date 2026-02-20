import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResolvedPalette } from '../domain/palette';

interface ProUnlockModalProps {
  visible: boolean;
  palette: ResolvedPalette;
  onClose: () => void;
  onUnlock: () => void;
}

export function ProUnlockModal({
  visible,
  palette,
  onClose,
  onUnlock,
}: ProUnlockModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: palette.pageBackground }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={[styles.closeText, { color: palette.textSecondary }]}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>Unlock Pretty Progress PRO</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Enable premium templates, advanced recurrence flows, and full customization controls.</Text>

          <View
            style={[
              styles.plan,
              {
                backgroundColor: palette.floatingBackground,
                borderColor: palette.border,
              },
            ]}>
            <Text style={[styles.planName, { color: palette.textPrimary }]}>Monthly</Text>
            <Text style={[styles.planPrice, { color: palette.textPrimary }]}>$3.99 / month</Text>
            <Text style={[styles.planLine, { color: palette.textSecondary }]}>• 6 PRO themes</Text>
            <Text style={[styles.planLine, { color: palette.textSecondary }]}>• Unlimited countdowns</Text>
            <Text style={[styles.planLine, { color: palette.textSecondary }]}>• Advanced reminder rules</Text>
          </View>

          <View
            style={[
              styles.plan,
              {
                backgroundColor: palette.floatingBackground,
                borderColor: palette.border,
              },
            ]}>
            <Text style={[styles.planName, { color: palette.textPrimary }]}>Yearly</Text>
            <Text style={[styles.planPrice, { color: palette.textPrimary }]}>$19.99 / year</Text>
            <Text style={[styles.planLine, { color: palette.textSecondary }]}>• Everything in monthly</Text>
            <Text style={[styles.planLine, { color: palette.textSecondary }]}>• Family sharing ready</Text>
            <Text style={[styles.planLine, { color: palette.textSecondary }]}>• 58% savings</Text>
          </View>

          <Pressable
            style={[styles.unlockButton, { backgroundColor: palette.textPrimary }]}
            onPress={onUnlock}>
            <Text style={styles.unlockText}>Unlock PRO</Text>
          </Pressable>
          <Text style={[styles.footnote, { color: palette.textTertiary }]}>Demo billing flow. Connect StoreKit products for live subscriptions.</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  plan: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  planLine: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  unlockButton: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  unlockText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
});
