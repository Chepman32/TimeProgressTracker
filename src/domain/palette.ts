import { AppearanceMode } from './types';

export interface ResolvedPalette {
  isDark: boolean;
  pageBackground: string;
  floatingBackground: string;
  elevatedBackground: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  separator: string;
  destructive: string;
}

export const LIGHT_PALETTE: ResolvedPalette = {
  isDark: false,
  pageBackground: '#f5f6fa',
  floatingBackground: 'rgba(255,255,255,0.8)',
  elevatedBackground: '#ffffff',
  textPrimary: '#0f1324',
  textSecondary: '#59607a',
  textTertiary: '#848ca8',
  border: 'rgba(17, 23, 41, 0.08)',
  separator: 'rgba(17, 23, 41, 0.12)',
  destructive: '#ff453a',
};

export const DARK_PALETTE: ResolvedPalette = {
  isDark: true,
  pageBackground: '#0e1020',
  floatingBackground: 'rgba(20,25,49,0.82)',
  elevatedBackground: '#161a30',
  textPrimary: '#f7f8ff',
  textSecondary: '#b5bddb',
  textTertiary: '#8089ae',
  border: 'rgba(195, 205, 255, 0.14)',
  separator: 'rgba(195, 205, 255, 0.2)',
  destructive: '#ff6961',
};

export function resolvePalette(
  appearance: AppearanceMode,
  systemIsDark: boolean,
): ResolvedPalette {
  if (appearance === 'light') {
    return LIGHT_PALETTE;
  }

  if (appearance === 'dark') {
    return DARK_PALETTE;
  }

  return systemIsDark ? DARK_PALETTE : LIGHT_PALETTE;
}
