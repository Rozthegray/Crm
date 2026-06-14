import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bank: {
          blue: {
            DEFAULT: '#0A2540', // Deep corporate blue
            light: '#1D4ED8',   // Interactive blue
            dark: '#001529',    // Sidebar/Footer blue
          },
          gold: {
            DEFAULT: '#D4AF37', // Premium gold accent
            light: '#FDE047',   // Highlight gold
          },
          bg: '#F8FAFC',        // Off-white for app background to make pure white cards pop
        }
      }
    },
  },
  plugins: [],
}
export default config