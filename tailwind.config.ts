import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',  /* Brief Section 5: Tablet breakpoint */
      lg: '992px',  /* Brief Section 5: Desktop breakpoint */
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-vazirmatn)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(2.2rem, 5vw, 3.4rem)', { lineHeight: '1.2', fontWeight: '900' }],
      },
      colors: {
        /* Brand Colors (Brief Section 5) */
        honey: {
          DEFAULT: '#F59E0B',
          dark: '#C86A00',
          amber: '#D97706',
          gold: '#FBBF24',
          light: '#FEF3C7',
          pale: '#FFFBEB',
        },
        amber: {
          brand: '#D97706',
        },
        gold: {
          brand: '#FBBF24',
        },
        /* Neutrals & Dark Tokens */
        chocolate: {
          DEFAULT: '#332115',
        },
        footer: {
          DEFAULT: '#4B3A2F',
          nav: '#403127',
        },
        text: {
          DEFAULT: '#2B2017',
          cream: '#E8E2D9',
          muted: '#5C5248',
        },
        warm: {
          DEFAULT: '#FDFBF8',
        },
        border: {
          DEFAULT: '#EFE9E0',
        },
        /* Accents */
        accent: {
          green: '#3F8F3B',
          orange: '#E07D2B',
        },
        /* Locked Card Themes */
        cardTheme: {
          green: {
            DEFAULT: '#4CA849',
            fg: '#FFFFFF',
          },
          orange: {
            DEFAULT: '#E08B38',
            fg: '#FFFFFF',
          },
          yellow: {
            DEFAULT: '#F5A623',
            fg: '#2B2017',
          },
          burgundy: {
            DEFAULT: '#9E3556',
            fg: '#FFFFFF',
          },
        },
        /* shadcn/ui HSL Tokens */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted-bg))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
