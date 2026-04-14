// constants/theme.js
// TechQuest Design System — Warm Retro-Futurism

export const Colors = {
  // Backgrounds
  background: '#1A1F35',
  surface: '#242B45',

  // Accents
  primary: '#F5C842',       // Warm gold
  primaryGlow: 'rgba(245, 200, 66, 0.25)',
  secondary: '#FF7B5C',     // Soft coral
  success: '#4ECBA0',       // Mint green

  // Text
  textPrimary: '#F0EDE8',   // Warm white
  textSecondary: '#9BA3BF', // Muted blue-gray

  // Borders / dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderGold: '#F5C842',
  borderSuccess: '#4ECBA0',

  // Status chips
  chipActive: 'rgba(255, 123, 92, 0.18)',
  chipActiveText: '#FF7B5C',
  chipLocked: 'rgba(155, 163, 191, 0.15)',
  chipLockedText: '#9BA3BF',
  chipCompleted: 'rgba(78, 203, 160, 0.18)',
  chipCompletedText: '#4ECBA0',

  // Mission dots
  dotFilled: '#F5C842',
  dotFilledSuccess: '#4ECBA0',
  dotEmpty: 'rgba(155, 163, 191, 0.3)',
};

export const FontFamily = {
  headingBold: 'Nunito_700Bold',
  headingExtraBold: 'Nunito_800ExtraBold',
  body: 'SourceSans3_400Regular',
  bodyBold: 'SourceSans3_700Bold',
  mono: 'SpaceMono_400Regular',
};

export const FontSize = {
  // Headings
  screenTitle: 30,
  sectionHeader: 22,
  cardTitle: 18,

  // Body (minimum 18px)
  body: 18,
  bodyLarge: 20,
  button: 20,

  // Supporting
  caption: 15,
  badge: 13,
  mono: 13,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const TouchTarget = {
  min: 56,   // All buttons minimum height
  nav: 72,   // Bottom nav
  fab: 64,   // Floating action button
  icon: 48,  // Icon-only tap targets
};
