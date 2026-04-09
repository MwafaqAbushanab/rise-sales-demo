// Rise Analytics brand constants for Remotion video compositions

export const BRAND = {
  colors: {
    emerald: '#059669',     // emerald-600
    teal: '#0d9488',        // teal-600
    emeraldDark: '#047857', // emerald-700
    emeraldLight: '#d1fae5',// emerald-100
    dark: '#111827',        // gray-900
    darkAlt: '#1f2937',     // gray-800
    text: '#111827',        // gray-900
    textMuted: '#6b7280',   // gray-500
    white: '#ffffff',
    offWhite: '#f9fafb',    // gray-50
    border: '#e5e7eb',      // gray-200
  },
  gradients: {
    primary: ['#059669', '#0d9488'] as const, // emerald-600 → teal-600
    dark: ['#111827', '#1f2937'] as const,    // gray-900 → gray-800
  },
  fonts: {
    primary: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },
} as const;

export const VIDEO = {
  fps: 30,
  resolutions: {
    '1080p': { width: 1920, height: 1080 },
    square: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
  },
  durations: {
    prospectHighlight: 15,   // seconds
    financialSnapshot: 20,
    competitivePitch: 20,
  },
} as const;

export type Resolution = keyof typeof VIDEO.resolutions;
