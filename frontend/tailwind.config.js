/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"SF Pro Display"', 'Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: {
          50: '#f4f3ff',
          100: '#ebe9ff',
          200: '#d9d4ff',
          300: '#beb4ff',
          400: '#9a87ff',
          500: '#7a5cff',
          600: '#6438ff',
          700: '#552ae6',
          800: '#4322b5',
          900: '#361d8e',
        },
        slate: {
          950: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 20px 45px -15px rgba(79, 70, 229, 0.25)',
      },
    },
  },
  plugins: [],
}
