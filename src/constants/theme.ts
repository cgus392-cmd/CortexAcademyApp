
// Core Cortex Brand Palettes (v3.1 Production Identity)
// Official Brand Colors: Cyan, Esmeralda, Violeta, Neon Rose
export const PALETTES = {
  cortex_classic: {
    // 💙 Cortex Signature: Cyan — primary brand color
    primary: '#06B6D4',
    primaryDark: '#0891B2',
    primaryDarker: '#0E7490',
    accent: '#34D399',    // Esmeralda accent
    secondary: '#0C4A6E',
    name: 'Cortex Classic',
  },
  esmeralda: {
    // 🟢 Cortex Esmeralda
    primary: '#34D399',
    primaryDark: '#10B981',
    primaryDarker: '#059669',
    accent: '#06B6D4',
    secondary: '#022C22',
    name: 'Esmeralda',
  },
  nebula_violeta: {
    // 🞣 Cortex Violeta
    primary: '#A78BFA',
    primaryDark: '#7C3AED',
    primaryDarker: '#4C1D95',
    accent: '#FB7185',    // Neon Rose accent
    secondary: '#2E1065',
    name: 'Nebula Violeta',
  },
  neon_rose: {
    // 💗 Cortex Neon Rose
    primary: '#FB7185',
    primaryDark: '#F43F5E',
    primaryDarker: '#9F1239',
    accent: '#A78BFA',
    secondary: '#4C0519',
    name: 'Neon Rose',
  },
  academic_gold: {
    // 🏅 Academic Gold — prestige palette
    primary: '#F59E0B',
    primaryDark: '#D97706',
    primaryDarker: '#92400E',
    accent: '#FCD34D',
    secondary: '#451A03',
    name: 'Academic Gold',
  },
};

export const Colors = {
  // Backgrounds & Neutrals
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Default Palette (Loaded initially)
  ...PALETTES.cortex_classic,
  
  // Status & Utility
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Typography
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // UI Components
  border: 'rgba(0,0,0,0.06)',
  divider: '#E2E8F0',
  inputBg: '#F1F5F9',

  // Architecture (Glassmorphism)
  glassBase: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
  glassHighlight: 'rgba(255, 255, 255, 1)',
  glassSpecular1: 'rgba(255, 255, 255, 0.6)',
  glassSpecular2: 'transparent',
  glassSpecular3: 'rgba(255, 255, 255, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  textContrast: '#FFFFFF',
};

export const CourseColors = [
  '#06B6D4', // Cortex Cyan
  '#34D399', // Esmeralda
  '#A78BFA', // Violeta
  '#FB7185', // Neon Rose
  '#F59E0B', // Academic Gold
  '#3B82F6', // Royal Blue
];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const Shadows = {
  sm: {},
  md: {},
  lg: {},
  xl: {},
  primary: {},
};
