import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

interface ToggleRowProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  textColor: string;
  secondaryTextColor: string;
  accentColor: string;
}

export function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
  textColor,
  secondaryTextColor,
  accentColor,
}: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textColumn}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(120,128,150,0.28)', true: accentColor }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textColumn: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
});
