// constants/theme.js
// TechQuest Design System — Warm Retro-Futurism

export const Colors = {
  // Backgrounds (light theme)
  background: '#FFFFFF',
  surface: '#F7F9FC',

  // Accents (balanced yellow, red, blue, green)
  primary: '#F4C430',       // Warm yellow
  primaryGlow: 'rgba(244, 196, 48, 0.24)',
  secondary: '#E74C3C',     // Friendly red
  success: '#2EAD74',       // Fresh green
  info: '#2F80ED',          // Clear blue

  // Text
  textPrimary: '#1F2937',   // Deep neutral for readability
  textSecondary: '#5B6475', // Cool gray

  // Borders / dividers
  border: '#DCE3EE',
  borderGold: '#F4C430',
  borderSuccess: '#2EAD74',

  // Status chips
  chipActive: 'rgba(231, 76, 60, 0.14)',
  chipActiveText: '#E74C3C',
  chipLocked: 'rgba(91, 100, 117, 0.12)',
  chipLockedText: '#5B6475',
  chipCompleted: 'rgba(46, 173, 116, 0.16)',
  chipCompletedText: '#2EAD74',

  // Mission dots
  dotFilled: '#F4C430',
  dotFilledSuccess: '#2EAD74',
  dotEmpty: '#C7D0DE',
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
