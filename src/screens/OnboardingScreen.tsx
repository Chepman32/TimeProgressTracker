import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResolvedPalette } from '../domain/palette';

interface OnboardingScreenProps {
  palette: ResolvedPalette;
  onFinish: () => void;
}

const STEPS = [
  {
    title: 'Beautiful countdown widgets',
    body: 'Track life goals, routines, and deadlines with polished visual progress.',
    icon: '⏳',
  },
  {
    title: 'Count up, count down, repeat',
    body: 'Use one-time or recurring timers with day/week/month/year logic.',
    icon: '🔁',
  },
  {
    title: 'Personalize every detail',
    body: 'Choose themes, colors, icons, reminders, and progress style to fit your setup.',
    icon: '🎨',
  },
] as const;

export function OnboardingScreen({ palette, onFinish }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  const actionLabel = useMemo(() => {
    return index === STEPS.length - 1 ? 'Start tracking' : 'Continue';
  }, [index]);

  const onPressAction = () => {
    if (index >= STEPS.length - 1) {
      onFinish();
      return;
    }

    setIndex(previous => previous + 1);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.floatingBackground,
            borderColor: palette.border,
          },
        ]}>
        <Text style={styles.icon}>{step.icon}</Text>
        <Text style={[styles.title, { color: palette.textPrimary }]}>{step.title}</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>{step.body}</Text>

        <View style={styles.dots}>
          {STEPS.map((item, stepIndex) => (
            <View
              key={item.title}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    stepIndex === index ? palette.textPrimary : palette.separator,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[styles.action, { backgroundColor: palette.textPrimary }]}
          onPress={onPressAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 42,
    marginBottom: 6,
  },
  title: {
    fontSize: 29,
    lineHeight: 33,
    textAlign: 'center',
    letterSpacing: -0.6,
    fontWeight: '800',
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  action: {
    marginTop: 4,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
