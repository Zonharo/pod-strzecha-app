import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    background: '#FFFFFF',
    surface: '#F7F5EF',
    surfaceStrong: '#F3EFE4',
    text: '#26221D',
    textMuted: '#625E56',
    primary: '#FBC329',
    onPrimary: '#26221D',
    ink: '#886300',
    border: '#E4E0D9',
    danger: '#C62828',
  },
  dark: {
    background: '#1D1B18',
    surface: '#26221D',
    surfaceStrong: '#332E27',
    text: '#F7F5EF',
    textMuted: '#B3ADA3',
    primary: '#FBC329',
    onPrimary: '#26221D',
    ink: '#FBC329',
    border: 'rgba(255,255,255,0.12)',
    danger: '#FF7A6E',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { md: 16, lg: 24, xl: 32 } as const;

export const useTheme = () => {
  const scheme: 'light' | 'dark' = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors: ThemeColors = palette[scheme];
  return { scheme, colors };
};
