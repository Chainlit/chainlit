/** @type {import('tailwindcss').Config} */
const px = (num) => `${num * 4}px`;
export default {
    darkMode: ["class"],
    content: ["./src/**/*.{ts,tsx,js,jsx}", "../../frontend/src/**/*.{ts,tsx,js,jsx}"],
  	theme: {
		spacing: {
			...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`${i}`, px(i)])), // Basic spacing from 0 to 19
			"1.5": "6px", 
			"2.5": "10px", 
			"3.5": "14px", 
		  },
		  fontSize: {
			xs: ["12px", { lineHeight: "16px" }],
			sm: ["14px", { lineHeight: "20px" }],
			base: ["16px", { lineHeight: "24px" }],
			lg: ["18px", { lineHeight: "28px" }],
			xl: ["20px", { lineHeight: "28px" }],
			"2xl": ["24px", { lineHeight: "32px" }],
			"3xl": ["30px", { lineHeight: "36px" }],
			"4xl": ["36px", { lineHeight: "40px" }],
			"5xl": ["48px", { lineHeight: "1" }],
		  },
		  size: Object.fromEntries(
			Array.from({ length: 21 }, (_, i) => [`${i}`, px(i)]) 
		  ),
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
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
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
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out'
		}
  	}
  },
  // eslint-disable-next-line
  plugins: [require("tailwindcss-animate")],
}

