import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const COLORS = {
  // Brand Colors
  primary: '#3B82F6',       // Royal Blue
  secondary: '#0891B2',     // Cyan / Teal
  darkText: '#0F172A',      // Crisp Dark Slate
  mutedText: '#64748B',     // Slate 500
  subtitleText: '#475569',  // Slate 600
  disabledText: '#94A3B8',  // Slate 400

  // UI Backgrounds
  background: '#FFFFFF',    // Main window background
  surface: '#F8FAFC',       // Card/Input light background
  border: '#E2E8F0',        // Divider / Border color
  inputBorder: '#CBD5E1',   // Focused / Active input border

  // Status Colors
  success: '#10B981',       // Emerald Green
  successBg: 'rgba(16, 185, 129, 0.08)',
  danger: '#EF4444',        // Red
  dangerBg: 'rgba(239, 68, 68, 0.05)',
  dangerBorder: 'rgba(239, 68, 68, 0.15)',
  dangerTextDark: '#991B1B',
  warning: '#F59E0B',       // Amber Yellow
  warningBg: 'rgba(245, 158, 11, 0.05)',
  warningBorder: 'rgba(245, 158, 11, 0.15)',
  warningTextDark: '#B45309',

  // Custom Colors
  inactiveTab: '#64748B',
  activeTab: '#3B82F6',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  }
};

export const FONTS = {
  size: {
    xs: 10,
    sm: 11,
    base: 12,
    md: 13,
    lg: 14,
    xl: 16,
    xxl: 18,
    title: 20,
    header: 22,
    logo: 32,
  },
  weight: {
    medium: '500',
    semibold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
    heavy: '950',
  }
};

export const LAYOUT = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isLargeScreen: SCREEN_WIDTH > 600,
  padding: SCREEN_WIDTH > 600 ? '10%' : 20,
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 20,
    round: 9999,
  }
};
