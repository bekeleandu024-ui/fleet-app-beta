// FleetOps Dark ERP Theme Configuration
export const darkERPTheme = {
  // Dark ERP Base Colors
  bg: '#070A12',           // near-black base
  surface: '#0C111C',       // dense graphite primary surface
  surface2: '#121A2A',      // secondary surface with minimal blue tint
    border: 'rgba(255,255,255,0.04)', // very subtle borders
  
  // Typography
  textPrimary: '#E8ECF6',
  textMuted: '#A8B2C6',
  
  // Brand Accent
    brandAccent: '#7F8AA3',   // muted accent used for static elements (keeps UI dark)
    hoverAccent: '#3A7BDB',   // pure blue used only for hover/interactive highlights
  
  // Severity Scale (use for pills, bars, deltas only)
  severity: {
    good: '#22C55E',        // Green
    watch: '#FACC15',       // Yellow (low)
    risk: '#F59E0B',        // Orange (medium)
    breach: '#EF4444',      // Red (high)
  },
  
  // Radii
  radius: {
     sm: '8px',
     md: '10px',
     lg: '12px',
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
  subtle: '0 1px 2px rgba(0,0,0,0.5)',
  card: '0 2px 6px rgba(0,0,0,0.5)',
  elevated: '0 6px 12px rgba(0,0,0,0.55)',
};
