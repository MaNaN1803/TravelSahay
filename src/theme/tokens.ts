import { Platform } from 'react-native';

export type ColorScheme = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  star: string;
  danger: string;
  success: string;
  overlay: string;
  skeleton: string;
  tabInactive: string;
};

// Palette: black · white · grey · silver · blue · gold (purple only as a faint trace).
// Blue = brand, gold = accent/stars, greys/black/white = surfaces & text.
export const palette: Record<'light' | 'dark', ColorScheme> = {
  light: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F4F7',
    card: '#FFFFFF',
    text: '#12151B',
    textMuted: '#6A707C',
    textInverse: '#FFFFFF',
    border: '#E4E7EE',
    primary: '#2563EB',
    primaryMuted: '#E3ECFD',
    onPrimary: '#FFFFFF',
    accent: '#B8901F',
    star: '#C9A227',
    danger: '#C2415F',
    success: '#2E8BB0',
    overlay: 'rgba(18,21,27,0.5)',
    skeleton: '#EBEEF2',
    tabInactive: '#969BA6',
  },
  dark: {
    bg: '#0A0B0E',
    surface: '#131519',
    surfaceAlt: '#1C1F25',
    card: '#16191E',
    text: '#F4F6F8',
    textMuted: '#A1A7B2',
    textInverse: '#0A0B0E',
    border: '#2A2E37',
    primary: '#4F8DF9',
    primaryMuted: '#15233D',
    onPrimary: '#FFFFFF',
    accent: '#D4AF37',
    star: '#D4AF37',
    danger: '#E0566F',
    success: '#46B6DC',
    overlay: 'rgba(5,6,9,0.7)',
    skeleton: '#1C1F25',
    tabInactive: '#6E737F',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  x2: 32,
  x3: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  x2: 28,
  x3: 34,
  x4: 42,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export function shadow(scheme: 'light' | 'dark', level: 1 | 2 | 3 = 1) {
  if (scheme === 'dark') {
    return {
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: level * 6,
      shadowOffset: { width: 0, height: level * 2 },
      elevation: level * 3,
    };
  }
  return {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08 + level * 0.02,
    shadowRadius: level * 6,
    shadowOffset: { width: 0, height: level * 2 },
    elevation: level * 2,
  };
}

export const fontFamily = Platform.select({
  ios: { rounded: 'System' },
  default: { rounded: 'sans-serif' },
})!;
