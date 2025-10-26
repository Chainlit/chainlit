/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        command: '#0066FF'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-2px) scale(1.05)' }
        },
        'command-shift': {
          '0%': { transform: 'translateX(-10px)', opacity: '0.8' },
          '50%': { transform: 'translateX(5px)' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'slide-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px) scale(0.95)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        },
        'expand-width': {
          '0%': { width: '0' },
          '100%': { width: '30%' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'bounce-subtle': 'bounce-subtle 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'command-shift': 'command-shift 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slide-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'expand-width': 'expand-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      transitionProperty: {
        'width-padding': 'width, padding'
      }
    }
  },
  safelist: [
    {
      pattern:
        /^(filter-none|blur(?:-\w+)?|brightness-\d+|contrast-\d+|grayscale(?:-\d+)?|hue-rotate-\d+|-hue-rotate-\d+|invert(?:-\d+)?|saturate-\d+|sepia(?:-\d+)?)$/
    },
    // Common layout utilities for custom elements
    {
      pattern: /^(flex|grid|block|inline|hidden|inline-block|inline-flex)$/
    },
    {
      pattern: /^(space-[xy]-\d+|gap-\d+|gap-[xy]-\d+)$/
    },
    {
      pattern:
        /^(items|justify|content)-(start|end|center|between|around|evenly|stretch|baseline)$/
    },
    {
      pattern: /^(flex|grid)-(row|col|wrap|nowrap|grow|shrink)(-reverse)?$/
    },
    {
      pattern: /^grid-cols-\d+$/
    },
    // Spacing utilities
    {
      pattern: /^[mp][tlrbxy]?-(\d+|px|auto)$/
    },
    {
      pattern: /^(w|h)-(full|\d+|px|auto|screen|min|max|fit)$/
    },
    {
      pattern: /^(min-|max-)?(w|h)-(\d+|full|screen|min|max|fit)$/
    },
    // Text utilities
    {
      pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/
    },
    {
      pattern: /^text-(left|center|right|justify)$/
    },
    {
      pattern:
        /^text-(muted-foreground|primary|secondary|destructive|accent|card-foreground)$/
    },
    {
      pattern:
        /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/
    },
    {
      pattern: /^(tracking|leading)-(tighter|tight|normal|wide|wider|widest)$/
    },
    // Color utilities
    {
      pattern:
        /^(bg|text|border)-(transparent|current|black|white|gray|red|green|blue|yellow|indigo|purple|pink)(-\d{50,950})?$/
    },
    {
      pattern:
        /^(bg|text|border)-(primary|secondary|accent|muted|card|popover|destructive)(-foreground)?$/
    },
    // Border utilities
    {
      pattern: /^border(-[tlrbxy])?(-\d+)?$/
    },
    {
      pattern: /^border-(solid|dashed|dotted|double|none)$/
    },
    {
      pattern: /^rounded(-\w+)?$/
    },
    {
      pattern: /^border-[tlrbxy]-\d+$/
    },
    {
      pattern:
        /^border-[tlrbxy]-(black|white|gray|red|green|blue|yellow|indigo|purple|pink)(-\d{50,950})?$/
    },
    // Position and display
    {
      pattern: /^(static|fixed|absolute|relative|sticky)$/
    },
    {
      pattern: /^(top|right|bottom|left|inset)-(\d+|px|auto|full)$/
    },
    // Other common utilities
    {
      pattern: /^cursor-(pointer|default|move|not-allowed|text|wait|help)$/
    },
    {
      pattern: /^transition(-\w+)?$/
    },
    {
      pattern: /^(opacity|z)-\d+$/
    },
    {
      pattern:
        /^overflow-(auto|hidden|visible|scroll|x-auto|y-auto|x-hidden|y-hidden)$/
    },
    {
      pattern: /^shadow(-\w+)?$/
    }
  ],
  plugins: [animate]
};
