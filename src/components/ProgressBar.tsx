import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  progress: number;
  trackColor: string;
  fillColor: string;
  height?: number;
}

export function ProgressBar({
  progress,
  trackColor,
  fillColor,
  height = 8,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }

    Animated.timing(animatedWidth, {
      toValue: trackWidth * clamped,
      duration: 950,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [animatedWidth, clamped, trackWidth]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const nextTrackWidth = event.nativeEvent.layout.width;
    if (nextTrackWidth <= 0) {
      return;
    }

    if (nextTrackWidth !== trackWidth) {
      setTrackWidth(nextTrackWidth);
      animatedWidth.setValue(nextTrackWidth * clamped);
    }
  };

  return (
    <View
      onLayout={onTrackLayout}
      style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: trackWidth > 0 ? animatedWidth : `${clamped * 100}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
