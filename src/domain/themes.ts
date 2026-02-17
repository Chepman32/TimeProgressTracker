import { ThemeId, ThemeTemplate } from './types';

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'swiss',
    name: 'Swiss Style',
    description: 'Clean typography with bold red accents.',
    isPro: false,
    borderRadius: 24,
    colors: {
      appBackground: ['#f7f8fb', '#eef1f7', '#fdfdff'],
      cardBackground: ['#ffffff', '#f7f7fb'],
      accent: '#ff3b30',
      textPrimary: '#181b26',
      textSecondary: '#5d6275',
      track: '#eceef6',
      positive: '#34c759',
      warning: '#ff9500',
    },
  },
  {
    id: 'grid',
    name: 'The Grid',
    description: 'Structured matrix with graphic contrast.',
    isPro: true,
    borderRadius: 18,
    colors: {
      appBackground: ['#0d1224', '#0e172f', '#171d38'],
      cardBackground: ['#121a30', '#202741'],
      accent: '#83a7ff',
      textPrimary: '#f5f7ff',
      textSecondary: '#b0bbd9',
      track: '#2d3858',
      positive: '#76f3c3',
      warning: '#ffc867',
    },
  },
  {
    id: 'aqua',
    name: 'Aqua',
    description: 'Floating gradients and luminous highlights.',
    isPro: true,
    borderRadius: 28,
    colors: {
      appBackground: ['#071226', '#123159', '#23618f'],
      cardBackground: ['#0f2546', '#184c74'],
      accent: '#56efe6',
      textPrimary: '#ebfcff',
      textSecondary: '#9fced8',
      track: '#2b5f7f',
      positive: '#6dffa6',
      warning: '#ffe08a',
    },
  },
  {
    id: 'retro',
    name: 'Retro OS',
    description: 'Classic desktop-inspired style with nostalgia.',
    isPro: true,
    borderRadius: 14,
    colors: {
      appBackground: ['#0f3e8f', '#164a9d', '#245fc0'],
      cardBackground: ['#d7dff7', '#becde8'],
      accent: '#17398a',
      textPrimary: '#14204a',
      textSecondary: '#364b78',
      track: '#9eb0d8',
      positive: '#238d52',
      warning: '#9e5117',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Subtle grayscale with generous spacing.',
    isPro: true,
    borderRadius: 30,
    colors: {
      appBackground: ['#f5f6f7', '#f1f2f4', '#fbfbfc'],
      cardBackground: ['#ffffff', '#f6f7f8'],
      accent: '#20242f',
      textPrimary: '#12141a',
      textSecondary: '#5c6170',
      track: '#e7e9ee',
      positive: '#2f7d5f',
      warning: '#b37a2b',
    },
  },
  {
    id: 'neon',
    name: 'Neon Night',
    description: 'High-contrast futuristic glow.',
    isPro: true,
    borderRadius: 22,
    colors: {
      appBackground: ['#06050f', '#181434', '#23214e'],
      cardBackground: ['#17142d', '#232046'],
      accent: '#8a7dff',
      textPrimary: '#f7f4ff',
      textSecondary: '#b8b1d8',
      track: '#322d55',
      positive: '#65f0bd',
      warning: '#ffd47c',
    },
  },
];

export const THEME_LOOKUP: Record<ThemeId, ThemeTemplate> = THEME_TEMPLATES.reduce(
  (accumulator, theme) => {
    accumulator[theme.id] = theme;
    return accumulator;
  },
  {} as Record<ThemeId, ThemeTemplate>,
);

export function getThemeById(themeId: ThemeId): ThemeTemplate {
  return THEME_LOOKUP[themeId] ?? THEME_LOOKUP.swiss;
}
