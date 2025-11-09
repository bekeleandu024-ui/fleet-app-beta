// FleetOps Dark ERP Theme Configuration
export const darkERPTheme = {
  // Dark ERP Base Colors
  bg: '#0F1422',           // midnight blue background
  surface: '#151B2E',       // primary surface
  surface2: '#1A2136',      // secondary surface
  border: 'rgba(255,255,255,0.08)', // subtle borders
  
  // Typography
  textPrimary: '#E8ECF6',
  textMuted: '#A8B2C6',
  
  // Brand Accent
  brandAccent: '#3A7BDB',   // links, focus, chips
  
  // Severity Scale (use for pills, bars, deltas only)
  severity: {
    good: '#22C55E',        // Green
    watch: '#FACC15',       // Yellow (low)
    risk: '#F59E0B',        // Orange (medium)
    breach: '#EF4444',      // Red (high)
  },
  
  // Radii
  radius: {
    sm: '10px',
    md: '12px',
    lg: '14px',
  },
};

export const typography = {
  body: '16px',
  sectionTitle: '20px',
  cardTitle: '14px',
  caption: '12px',
  label: '13px',
};

export const spacing = {
  grid: '8px',              // 8px grid system
  gap: '24px',              // gap-6 (3 * 8px)
  cardPadding: '24px',      // Larger cards: increased padding
  base: 8,                  // Base unit for 8px grid
};

// Helper to calculate spacing on 8px grid
export const sp = (multiplier: number) => `${spacing.base * multiplier}px`;

export const shadows = {
  subtle: '0 1px 2px rgba(0,0,0,0.2)',
  card: '0 2px 4px rgba(0,0,0,0.3)',
  elevated: '0 4px 8px rgba(0,0,0,0.4)',
};
