import React, { useEffect, useRef } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  backgroundColor: string;
  activeColor: string;
  textColor: string;
  activeTextColor: string;
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
  backgroundColor,
  activeColor,
  textColor,
  activeTextColor,
}: SegmentedControlProps<T>) {
  const indicator = useRef(new Animated.Value(0)).current;
  const segmentWidth = useRef(0);

  useEffect(() => {
    const index = options.findIndex(option => option.value === selected);
    if (index < 0 || segmentWidth.current === 0) {
      return;
    }

    Animated.spring(indicator, {
      toValue: index * segmentWidth.current,
      useNativeDriver: true,
      velocity: 1.2,
      tension: 120,
      friction: 14,
    }).start();
  }, [indicator, options, selected]);

  const onLayout = (event: LayoutChangeEvent) => {
    segmentWidth.current = event.nativeEvent.layout.width / options.length;
    const index = options.findIndex(option => option.value === selected);
    indicator.setValue(Math.max(index, 0) * segmentWidth.current);
  };

  return (
    <View style={[styles.wrapper, { backgroundColor }]} onLayout={onLayout}>
      <Animated.View
        style={[
          styles.active,
          {
            backgroundColor: activeColor,
            width: `${100 / options.length}%`,
            transform: [{ translateX: indicator }],
          },
        ]}
      />
      {options.map(option => {
        const isActive = option.value === selected;

        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => onChange(option.value)}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={[styles.text, { color: isActive ? activeTextColor : textColor }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    padding: 5,
    flexDirection: 'row',
    position: 'relative',
  },
  active: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 5,
    borderRadius: 13,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
