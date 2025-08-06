/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4361ee',
        'primary-dark': '#3a56d4',
        'primary-light': '#edf2fe',
        text: '#2b2d42',
        'text-light': '#8d99ae',
        bg: '#f8f9fa',
        card: '#ffffff',
        border: '#e9ecef',
      },
    },
  },
  plugins: [],
}
