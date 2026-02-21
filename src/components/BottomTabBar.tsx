import React, { useEffect, useRef } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AppTab } from '../domain/types';
import { ResolvedPalette } from '../domain/palette';

interface TabItem {
  value: AppTab;
  label: string;
}

const TAB_ITEMS: TabItem[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'library', label: 'Library' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'settings', label: 'Settings' },
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
        const iconColor = isActive ? '#ffffff' : palette.textTertiary;
        const labelStyle = { color: isActive ? '#ffffff' : palette.textSecondary };

        return (
          <Pressable
            key={item.value}
            style={styles.item}
            onPress={() => onChangeTab(item.value)}>
            <TabIcon tab={item.value} color={iconColor} size={24} />
            <Text style={[styles.label, labelStyle]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface TabIconProps {
  tab: AppTab;
  color: string;
  size: number;
}

function TabIcon({ tab, color, size }: TabIconProps) {
  switch (tab) {
    case 'dashboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="3" width="7.5" height="7.5" rx="1.6" fill={color} />
          <Rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" fill={color} opacity={0.9} />
          <Rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" fill={color} opacity={0.9} />
          <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" fill={color} />
        </Svg>
      );
    case 'library':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="4" y="4.5" width="5.3" height="15" rx="1.4" fill={color} />
          <Rect x="9.35" y="4.5" width="5.3" height="15" rx="1.4" fill={color} opacity={0.88} />
          <Rect x="14.7" y="4.5" width="5.3" height="15" rx="1.4" fill={color} opacity={0.74} />
        </Svg>
      );
    case 'timeline':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8.2" stroke={color} strokeWidth={2.2} fill="none" />
          <Path d="M12 7.5v5l3.5 2" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 2.8l1.4.4.5 1.8 1.9.8 1.7-1 1 .9-.9 1.8.8 1.8 1.9.6.3 1.4-1.4.9v2.1l1.4.9-.3 1.4-1.9.6-.8 1.8.9 1.8-1 .9-1.7-1-1.9.8-.5 1.8-1.4.4-1.4-.4-.5-1.8-1.9-.8-1.7 1-1-.9.9-1.8-.8-1.8-1.9-.6-.3-1.4 1.4-.9v-2.1l-1.4-.9.3-1.4 1.9-.6.8-1.8-.9-1.8 1-.9 1.7 1 1.9-.8.5-1.8z"
            fill={color}
          />
          <Circle cx="12" cy="12" r="3.2" fill="#000000" opacity={0.18} />
        </Svg>
      );
    default:
      return null;
  }
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
    gap: 3,
    paddingVertical: 10,
    zIndex: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
