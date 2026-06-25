/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#CC785C',
          hover: '#b8674e',
          light: '#e8a98f',
        },
        surface: {
          light: '#F5F5F5',
          dark: '#2A2A2A',
        },
        border: {
          light: '#E5E5E5',
          dark: '#404040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      borderRadius: {
        card: '8px',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
}
