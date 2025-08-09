/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.{css}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand-primary))',
          '600': 'rgb(var(--brand-primary-600))',
          '700': 'rgb(var(--brand-primary-700))',
          ink: 'rgb(var(--brand-ink))'
        }
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.05), 0 6px 12px -4px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
};

