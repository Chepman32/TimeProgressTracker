import React, { PropsWithChildren, useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface AppBackgroundProps {
  colors: string[];
  isDark: boolean;
  style?: ViewStyle;
}

function Bubble({
  color,
  size,
  top,
  left,
  delay,
}: {
  color: string;
  size: number;
  top: DimensionValue;
  left: DimensionValue;
  delay: number;
}) {
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(offset, {
          toValue: 1,
          duration: 3400,
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          toValue: 0,
          duration: 3400,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [delay, offset]);

  const translateY = offset.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          left,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export function AppBackground({
  children,
  colors,
  isDark,
  style,
}: PropsWithChildren<AppBackgroundProps>) {
  return (
    <View style={[styles.container, style, { backgroundColor: colors[0] }]}>
      <View style={[styles.overlay, { backgroundColor: colors[1] }]} />
      <View style={[styles.overlayBottom, { backgroundColor: colors[2] ?? colors[1] }]} />
      <Bubble
        color={isDark ? 'rgba(122, 161, 255, 0.22)' : 'rgba(255, 255, 255, 0.7)'}
        size={280}
        top="-10%"
        left="-28%"
        delay={180}
      />
      <Bubble
        color={isDark ? 'rgba(86, 239, 230, 0.14)' : 'rgba(255, 121, 108, 0.11)'}
        size={220}
        top="50%"
        left="70%"
        delay={400}
      />
      <Bubble
        color={isDark ? 'rgba(184, 150, 255, 0.14)' : 'rgba(130, 170, 255, 0.17)'}
        size={190}
        top="22%"
        left="58%"
        delay={900}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  overlayBottom: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
    transform: [{ translateY: 140 }],
  },
  bubble: {
    position: 'absolute',
  },
  content: {
    flex: 1,
  },
});
