// Preset color themes for booking pages
// Each theme has Primary (buttons/headers), Secondary (backgrounds/cards), Accent (highlights/CTAs)

export const PRESET_THEMES = {
  forest: {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural green tones for health and wellness',
    colors: {
      primary: {
        50: '#e6f4e9',
        100: '#c0e5c8',
        200: '#99d5a6',
        300: '#73c685',
        400: '#4cb663',
        500: '#26a742',
        600: '#096b17',
        700: '#075713',
        800: '#05430f',
        900: '#032f0b'
      },
      secondary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      },
      accent: {
        50: '#f0faf3',
        100: '#d9f2e2',
        200: '#b3e6c5',
        300: '#8dd9a8',
        400: '#64cb81',
        500: '#4bb86d',
        600: '#3c9557',
        700: '#2d7141',
        800: '#1e4d2c',
        900: '#0f2916'
      }
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Calming blue tones for trust and professionalism',
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e'
      },
      accent: {
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63'
      }
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm orange tones for energy and approachability',
    colors: {
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12'
      },
      secondary: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f'
      },
      accent: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
      }
    }
  },
  royal: {
    id: 'royal',
    name: 'Royal Purple',
    description: 'Elegant purple tones for sophistication',
    colors: {
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87'
      },
      secondary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95'
      },
      accent: {
        50: '#fdf4ff',
        100: '#fae8ff',
        200: '#f5d0fe',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        600: '#c026d3',
        700: '#a21caf',
        800: '#86198f',
        900: '#701a75'
      }
    }
  },
  teal: {
    id: 'teal',
    name: 'Medical Teal',
    description: 'Classic medical teal for clinical professionalism',
    colors: {
      primary: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a'
      },
      secondary: {
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63'
      },
      accent: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e'
      }
    }
  },
  coral: {
    id: 'coral',
    name: 'Coral Pink',
    description: 'Soft coral tones for warmth and care',
    colors: {
      primary: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337'
      },
      secondary: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        800: '#9d174d',
        900: '#831843'
      },
      accent: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
      }
    }
  }
};

export const DEFAULT_THEME = 'forest';

export function getThemeById(themeId) {
  return PRESET_THEMES[themeId] || PRESET_THEMES[DEFAULT_THEME];
}

export function getThemeList() {
  return Object.values(PRESET_THEMES);
}

// Map old colorScheme values to new theme ids (for backward compatibility)
export const COLOR_SCHEME_TO_THEME_MAP = {
  'green': 'forest',
  'blue': 'ocean',
  'purple': 'royal',
  'orange': 'sunset',
  'red': 'coral',
  'teal': 'teal',
  'indigo': 'ocean',
};

export function resolveThemeId(bookingPage) {
  // If theme is explicitly set, use it
  if (bookingPage?.theme) {
    return bookingPage.theme;
  }
  // For old pages without theme field, default to forest (green)
  // Ignore the old colorScheme field as it defaulted to 'blue' which isn't the desired default
  return DEFAULT_THEME;
}
