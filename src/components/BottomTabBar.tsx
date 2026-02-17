import React, { useEffect, useRef } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppTab } from '../domain/types';
import { ResolvedPalette } from '../domain/palette';

interface TabItem {
  value: AppTab;
  label: string;
  icon: string;
}

const TAB_ITEMS: TabItem[] = [
  { value: 'dashboard', label: 'Dashboard', icon: '◼︎' },
  { value: 'library', label: 'Library', icon: '✦' },
  { value: 'timeline', label: 'Timeline', icon: '◷' },
  { value: 'settings', label: 'Settings', icon: '⚙︎' },
];

interface BottomTabBarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  palette: ResolvedPalette;
  accentColor: string;
}

export function BottomTabBar({
  activeTab,
  onChangeTab,
  palette,
  accentColor,
}: BottomTabBarProps) {
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth = useRef(0);

  useEffect(() => {
    const index = TAB_ITEMS.findIndex(tab => tab.value === activeTab);

    if (tabWidth.current === 0 || index < 0) {
      return;
    }

    Animated.spring(indicatorX, {
      toValue: index * tabWidth.current,
      useNativeDriver: true,
      velocity: 2,
      tension: 140,
      friction: 14,
    }).start();
  }, [activeTab, indicatorX]);

  const onLayout = (event: LayoutChangeEvent) => {
    tabWidth.current = event.nativeEvent.layout.width / TAB_ITEMS.length;
    const index = TAB_ITEMS.findIndex(tab => tab.value === activeTab);
    indicatorX.setValue(Math.max(index, 0) * tabWidth.current);
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: palette.floatingBackground,
          borderColor: palette.border,
        },
      ]}
      onLayout={onLayout}>
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${100 / TAB_ITEMS.length}%`,
            transform: [{ translateX: indicatorX }],
            backgroundColor: accentColor,
          },
        ]}
      />
      {TAB_ITEMS.map(item => {
        const isActive = item.value === activeTab;
        const iconStyle = { color: isActive ? '#ffffff' : palette.textTertiary };
        const labelStyle = { color: isActive ? '#ffffff' : palette.textSecondary };

        return (
          <Pressable
            key={item.value}
            style={styles.item}
            onPress={() => onChangeTab(item.value)}>
            <Text style={[styles.icon, iconStyle]}>
              {item.icon}
            </Text>
            <Text style={[styles.label, labelStyle]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    padding: 4,
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 18,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 8,
    zIndex: 2,
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
