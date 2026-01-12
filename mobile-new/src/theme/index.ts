// Wandr Brand Theme Configuration

export const BRAND = {
  name: 'Wandr',
  tagline: 'Explore. Collect. Discover.',
  description: "Your personal guide to the world's most amazing places",
};

export const colors = {
  // Primary - Deep Teal (exploration, trust, adventure)
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',

  // Secondary - Warm Amber (discovery, energy, achievement)
  secondary: '#F59E0B',
  secondaryLight: '#FBBF24',
  secondaryDark: '#D97706',

  // Accent - Coral (badges, highlights)
  accent: '#F97316',
  accentLight: '#FB923C',
  accentDark: '#EA580C',

  // Neutrals
  background: '#FFFFFF',
  backgroundDark: '#0F172A',
  backgroundSecondary: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceDark: '#1E293B',
  card: '#FFFFFF',
  cardDark: '#334155',
  
  text: '#0F172A',
  textLight: '#FFFFFF',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderDark: '#475569',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Badge Tiers
  badgeBronze: '#CD7F32',
  badgeSilver: '#C0C0C0',
  badgeGold: '#FFD700',
  badgePlatinum: '#E5E4E2',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#0D9488', '#0F766E'] as const,
  gradientSecondary: ['#F59E0B', '#D97706'] as const,
  gradientAccent: ['#F97316', '#EA580C'] as const,
  gradientDark: ['#0F172A', '#1E293B', '#0F172A'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export default { BRAND, colors, spacing, borderRadius, typography, shadows };
