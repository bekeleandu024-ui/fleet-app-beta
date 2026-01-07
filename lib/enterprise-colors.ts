/**
 * Enterprise-Grade Industrial Design Color Palette
 * 
 * Design Philosophy:
 * - Gray is the default state for all data
 * - Color = requires action or indicates a problem
 * - Maximum 2 colors visible per view
 * - Desaturated, muted tones instead of vibrant colors
 * - Typography (weight, size, spacing) creates hierarchy, not color
 */

export const enterprisePalette = {
  // Base tones (use these for 90% of UI)
  background: {
    primary: '#111114',
    secondary: '#1c1c22',
    elevated: '#2a2a32',
  },
  text: {
    primary: '#e8e8ed',      // Main values, names
    secondary: '#a0a0b0',    // Regular data
    muted: '#5a5a6e',        // Labels, inactive
  },
  border: '#1c1c22',
  borderSubtle: '#3a3a42',
  
  // Semantic colors (use sparingly - only for exceptions)
  status: {
    critical: '#b45353',     // Losses, required actions, failures
    warning: '#c97a5a',      // At risk, approaching limits
    success: '#5a7a6b',      // Only for confirmations, not default "good" state
    info: '#5a6a8a',         // Links, interactive elements
  },
  
  // Map-specific desaturated colors
  map: {
    pickupGeofence: '#5a7a6b',    // muted green
    deliveryGeofence: '#5a6a8a', // muted blue  
    hysteresisZone: '#6a5a7a',   // muted purple
    gpsTrail: '#5a8a8a',         // muted cyan
    plannedRoute: '#5a5a6e',     // gray
  },
} as const;

// Tailwind CSS class mappings for easy use
export const enterpriseClasses = {
  // Backgrounds
  bgPrimary: 'bg-[#111114]',
  bgSecondary: 'bg-[#1c1c22]',
  bgElevated: 'bg-[#2a2a32]',
  
  // Text colors
  textPrimary: 'text-[#e8e8ed]',
  textSecondary: 'text-[#a0a0b0]',
  textMuted: 'text-[#5a5a6e]',
  
  // Status colors
  textCritical: 'text-[#b45353]',
  textWarning: 'text-[#c97a5a]',
  textSuccess: 'text-[#5a7a6b]',
  textInfo: 'text-[#5a6a8a]',
  
  // Borders
  borderDefault: 'border-[#1c1c22]',
  borderSubtle: 'border-[#3a3a42]',
  
  // Backgrounds for status
  bgCritical: 'bg-[#b45353]',
  bgWarning: 'bg-[#c97a5a]',
  bgSuccess: 'bg-[#5a7a6b]',
  bgInfo: 'bg-[#5a6a8a]',
} as const;

/**
 * Helper to determine if a value requires color highlighting
 */
export function shouldHighlight(type: 'profit' | 'margin' | 'hos' | 'timing', value: number | boolean | null | undefined): 'critical' | 'warning' | 'none' {
  switch (type) {
    case 'profit':
    case 'margin':
      if (typeof value === 'number' && value < 0) return 'critical';
      return 'none';
    case 'hos':
      if (typeof value === 'number') {
        if (value < 2) return 'critical';
        if (value < 4) return 'warning';
      }
      return 'none';
    case 'timing':
      if (value === false) return 'critical'; // Late
      return 'none';
    default:
      return 'none';
  }
}

/**
 * Get color for a value based on highlight status
 */
export function getValueColor(highlight: 'critical' | 'warning' | 'none'): string {
  switch (highlight) {
    case 'critical': return enterprisePalette.status.critical;
    case 'warning': return enterprisePalette.status.warning;
    default: return enterprisePalette.text.primary;
  }
}

/**
 * Get secondary value color (for metrics like RPM/CPM)
 */
export function getSecondaryColor(): string {
  return enterprisePalette.text.secondary;
}

/**
 * Get muted color for labels and inactive elements
 */
export function getMutedColor(): string {
  return enterprisePalette.text.muted;
}
