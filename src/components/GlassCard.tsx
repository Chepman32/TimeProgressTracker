import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  backgroundColor: string;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({
  children,
  backgroundColor,
  borderColor,
  style,
}: PropsWithChildren<GlassCardProps>) {
  return (
    <View style={[styles.card, { backgroundColor, borderColor }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
