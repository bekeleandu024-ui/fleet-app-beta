// Enterprise Theme Configuration
export const themeColors = {
  // Neutral enterprise palette
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  // Single brand accent
  brand: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // Status & severity colors
  status: {
    breach: '#DC2626',      // Red - true incidents
    risk: '#EA580C',        // Orange - at risk
    watch: '#EAB308',       // Yellow - watch
    info: '#3B82F6',        // Blue - informational
    good: '#16A34A',        // Green - on track
  },
};

export const typography = {
  body: '16px',
  sectionTitle: '24px',
  cardTitle: '14px',
  caption: '12px',
};

export const spacing = {
  grid: '12-column',
  gap: '24px', // gap-6
  cardPadding: '16px',
};

export const themes = {
  light: {
    bg: themeColors.neutral[50],
    surface: '#FFFFFF',
    text: themeColors.neutral[900],
    textSecondary: themeColors.neutral[600],
    border: themeColors.neutral[200],
    divider: themeColors.neutral[200],
  },
  dark: {
    bg: themeColors.neutral[900],
    surface: themeColors.neutral[800],
    text: themeColors.neutral[50],
    textSecondary: themeColors.neutral[400],
    border: themeColors.neutral[700],
    divider: themeColors.neutral[700],
  },
  highContrast: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#000000',
    border: '#000000',
    divider: '#000000',
  },
  print: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#333333',
    border: '#CCCCCC',
    divider: '#CCCCCC',
  },
};
