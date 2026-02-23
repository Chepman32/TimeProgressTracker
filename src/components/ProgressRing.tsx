import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number;
  trackColor: string;
  fillColor: string;
  animateOnMount?: boolean;
  animationDelayMs?: number;
  animationDurationMs?: number;
}

export function ProgressRing({
  size,
  strokeWidth,
  progress,
  trackColor,
  fillColor,
  animateOnMount = false,
  animationDelayMs = 0,
  animationDurationMs = 900,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useRef(
    new Animated.Value(animateOnMount ? 0 : clamped),
  ).current;
  const hasAnimatedOnMount = useRef(false);

  useEffect(() => {
    if (animateOnMount && !hasAnimatedOnMount.current) {
      hasAnimatedOnMount.current = true;
      Animated.timing(animatedProgress, {
        toValue: clamped,
        duration: animationDurationMs,
        delay: animationDelayMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }

    animatedProgress.setValue(clamped);
  }, [
    animateOnMount,
    animatedProgress,
    animationDelayMs,
    animationDurationMs,
    clamped,
  ]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <Svg width={size} height={size}>
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={fillColor}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}
