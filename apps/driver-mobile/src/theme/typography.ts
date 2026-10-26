import type { TextStyle } from 'react-native'

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
} as const satisfies Record<string, TextStyle>

export type TypographyVariant = keyof typeof typography
